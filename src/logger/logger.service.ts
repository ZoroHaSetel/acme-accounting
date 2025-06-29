import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class LoggerService {
  constructor(private readonly logger: PinoLogger) {}

  info(message: string, meta?: any) {
    this.logger.info(meta || {}, message);
  }

  warn(message: string, meta?: any) {
    this.logger.warn(meta || {}, message);
  }

  error(message: string, meta?: any) {
    this.logger.error(meta || {}, message);
  }

  debug(message: string, meta?: any) {
    this.logger.debug(meta || {}, message);
  }
}
