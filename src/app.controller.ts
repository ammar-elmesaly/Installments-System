import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/public.decorator';
import { CronGuard } from './auth/cron.guard';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
  ) {}

  @Post('cron-job')
  @Public()
  @UseGuards(CronGuard)
  handleCronJob() {
    return this.appService.handleDailyOverdueCheck();
  }
}
