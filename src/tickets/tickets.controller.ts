import { Body, ConflictException, Controller, Get, Post } from '@nestjs/common';
import { Company } from '../../db/models/Company';
import {
  Ticket,
  TicketCategory,
  TicketStatus,
  TicketType,
} from '../../db/models/Ticket';
import { User, UserRole } from '../../db/models/User';
import { where } from 'sequelize';
import { ticketDuplicateError } from './ticket-error';

interface newTicketDto {
  type: TicketType;
  companyId: number;
}

interface TicketDto {
  id: number;
  type: TicketType;
  companyId: number;
  assigneeId: number;
  status: TicketStatus;
  category: TicketCategory;
}

const ticketTypeCategoryMap = {
  [TicketType.managementReport]: TicketCategory.accounting,
  [TicketType.strikeOff]: TicketCategory.management,
};
const userRoleTicketTypeMap = {
  [TicketType.managementReport]: UserRole.accountant,
  [TicketType.strikeOff]: UserRole.director,
  [TicketType.registrationAddressChange]: UserRole.corporateSecretary,
};

@Controller('api/v1/tickets')
export class TicketsController {
  @Get()
  async findAll() {
    return await Ticket.findAll({ include: [Company, User] });
  }

  @Post()
  async create(@Body() newTicketDto: newTicketDto) {
    const { type, companyId } = newTicketDto;

    const category = ticketTypeCategoryMap[type] || TicketCategory.corporate;

    const userRole = userRoleTicketTypeMap[type] || UserRole.corporateSecretary;

    const assignees = await User.findAll({
      where: { companyId, role: userRole },
      order: [['createdAt', 'DESC']],
    });
    let assignee: User;

    // Handle case where corporate secretary is not the only user
    if (userRole === UserRole.corporateSecretary && assignees.length > 1)
      throw new ConflictException(
        `Multiple users with role ${userRole}. Cannot create a ticket`,
      );

    if (type === TicketType.registrationAddressChange) {
      // special case for registration address change
      assignee = await this.handleTicketRegistrationAddressChange(
        companyId,
        assignees,
      );
    } else {
      // other ticket types
      if (!assignees.length)
        throw new ConflictException(
          `Cannot find user with role ${userRole} to create a ticket`,
        );
      assignee = assignees[0];
    }
    if (type === TicketType.strikeOff) {
      await this.handleStrikeOffTicket(companyId, assignees);
    }

    const ticket = await Ticket.create({
      companyId,
      assigneeId: assignee.id,
      category,
      type,
      status: TicketStatus.open,
    });

    const ticketDto: TicketDto = {
      id: ticket.id,
      type: ticket.type,
      assigneeId: ticket.assigneeId,
      status: ticket.status,
      category: ticket.category,
      companyId: ticket.companyId,
    };

    return ticketDto;
  }

  /**
   * Validate if a ticket for registration address change can be created.
   * It checks if a ticket of this type already exists and assigns it to the appropriate user.
   * @param companyId - The ID of the company for which the ticket is being created.
   * @returns The user assigned to the ticket.
   * @throws {ticketDuplicateError} If a ticket of this type already exists.
   * @throws {ConflictException} If no corporate secretary or director is available to assign the ticket.
   */
  async handleTicketRegistrationAddressChange(
    companyId,
    currentSecreteryList: User[],
  ) {
    let assigne: User;
    // if ticket type registrationAddressChange already exist then throw error
    let checkTicket = await Ticket.findAll({
      where: {
        type: TicketType.registrationAddressChange,
        companyId: companyId,
      },
    });
    if (checkTicket.length > 0) {
      throw new ticketDuplicateError('Ticket duplicated');
    }
    // if we cannot find a corporate secretary, assign it to the `Director`. If there are multiple directors, throw an error.

    if (currentSecreteryList.length == 0) {
      let director = await User.findAll({
        where: { role: UserRole.director },
      });
      if (director.length == 1) assigne = director[0];
      else
        throw new ConflictException(
          `number of user with role ${UserRole.director} not fit to create a ticket`,
        );
    } else assigne = currentSecreteryList[0];
    if (!assigne)
      throw new ConflictException(
        `Unable to create ticket due to insufficient human resource`,
      );
    return assigne;
  }

  async handleStrikeOffTicket(companyId: number, directorList: User[]) {
    if (directorList.length == 1) {
      // resolve all other company tickets
      await Ticket.update(
        { status: TicketStatus.resolved },
        {
          where: {
            companyId: companyId,
            status: TicketStatus.open,
          },
        },
      );
      return directorList[0];
    } else
      throw new ConflictException(
        `number of user with role ${UserRole.director} not fit to create a ticket`,
      );
  }
}
