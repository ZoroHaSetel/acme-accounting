import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { DbModule } from './db.module';
import { TicketsController } from './tickets/tickets.controller';
import { ReportsController } from './reports/reports.controller';
import { HealthcheckController } from './healthcheck/healthcheck.controller';
import { ReportsService } from './reports/reports.service';
import { TicketsService } from './tickets/tickets.service';
import { LoggerModule } from './logger/logger.module';
import { RequestLoggerMiddleware } from './logger/request-logger.middleware';

@Module({
  imports: [DbModule, LoggerModule],
  controllers: [TicketsController, ReportsController, HealthcheckController],
  providers: [ReportsService, TicketsService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
