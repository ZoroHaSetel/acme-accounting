export class TicketDuplicateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TicketDuplicationError';
  }
}