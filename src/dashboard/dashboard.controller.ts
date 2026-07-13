import { Controller, Get, Query } from '@nestjs/common';

import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  getDashboard(@Query('archiveLimit') archiveLimit?: string) {
    return this.dashboardService.getDashboard({
      archiveLimit: archiveLimit ? Number(archiveLimit) : undefined,
    });
  }
}