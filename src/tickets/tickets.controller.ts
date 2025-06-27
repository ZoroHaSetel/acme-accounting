import { Body, Controller, Get, Post } from '@nestjs/common';
import { Company } from '../../db/models/Company';
import {
  Ticket,
  TicketCategory,
  TicketStatus,
  TicketType,
} from '../../db/models/Ticket';
import { User, UserRole } from '../../db/models/User';
import { where } from 'sequelize';
import { TicketDuplicateError } from './ticket-error';
import { NewTicketDto } from './ticket.dto';
import { TicketsService, TicketDto } from './tickets.service';

@Controller('api/v1/tickets')
export class TicketsController {
  constructor(private ticketsService: TicketsService) {}

  @Get()
  async findAll() {
    return await Ticket.findAll({ include: [Company, User] });
  }

  @Post()
  async create(@Body() newTicketDto: NewTicketDto): Promise<TicketDto> {
    return this.ticketsService.createTicket(newTicketDto);
  }
}
