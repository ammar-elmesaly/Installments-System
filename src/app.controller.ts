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
}
