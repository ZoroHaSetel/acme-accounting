import { Controller, Get, Post, HttpCode, Param } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('api/v1/reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get(':id')
  getStatus(@Param('id') id: string) {
    return this.reportsService.state(id);
  }

  @Post()
  @HttpCode(201)
  generate() {
    return this.reportsService.startReportExport();
  }
}
