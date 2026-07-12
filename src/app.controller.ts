import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { TelegramService } from './utils/telegram.service';
import { Public } from './auth/public.decorator';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly telegramService: TelegramService
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('test-telegram')
  @Public()
  async testTelegram() {
    await this.telegramService.sendAdminNotification('*Nice* **Nice** _Nice_');
    return { success: true, message: 'Test message sent to Telegram!' };
  }
}
