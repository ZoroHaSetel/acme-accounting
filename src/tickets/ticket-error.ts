export class ticketDuplicateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TicketDuplicationError';
  }
}