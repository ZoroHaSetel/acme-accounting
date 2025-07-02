import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from './logger.service';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req;
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      this.logger.info(
        `${method} ${originalUrl} ${res.statusCode} - ${duration}ms`,
        { method, url: originalUrl, statusCode: res.statusCode, duration }
      );
    });
    next();
  }
}
