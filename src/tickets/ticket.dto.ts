import { TicketType } from "db/models/Ticket";
import { IsEnum, IsInt } from "class-validator";
import { Type } from "class-transformer";

export class NewTicketDto {
  @IsEnum(TicketType)
  type: TicketType;

  @Type(() => Number)
  @IsInt()
  companyId: number;
}