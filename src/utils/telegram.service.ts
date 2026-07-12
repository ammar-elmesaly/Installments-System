import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  async sendAdminNotification(message: string): Promise<void> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

    if (!token || !chatId) {
      this.logger.warn('Telegram credentials are missing in .env');
      return;
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown',
        }),
      });
    } catch (error) {
      this.logger.error('Failed to send Telegram message', error);
    }
  }
}