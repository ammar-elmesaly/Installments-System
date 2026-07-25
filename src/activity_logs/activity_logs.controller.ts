import { Controller, DefaultValuePipe, Get, ParseIntPipe, Query } from '@nestjs/common';
import { ActivityLogsService } from './activity_logs.service';

@Controller('activity-log')
export class ActivityLogsController {
  constructor(private activityLogService: ActivityLogsService) {}

  @Get('all')
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    return this.activityLogService.paginate({ page, limit: Math.min(limit, 100) });
  }
}