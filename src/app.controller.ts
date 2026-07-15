import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { TelegramService } from './utils/telegram.service';
import { Public } from './auth/public.decorator';
import { CronGuard } from './auth/cron.guard';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly telegramService: TelegramService
  ) {}

  @Post('cron-job')
  @Public()
  @UseGuards(CronGuard)
  async handleCronJob() {
    await this.telegramService.sendAdminNotification('Cron JOB Working!');
    return { message: 'Cron job completed successfully!'};
  }
}
