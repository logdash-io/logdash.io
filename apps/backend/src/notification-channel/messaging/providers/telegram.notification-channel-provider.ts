import { Injectable } from '@nestjs/common';
import axios from 'axios';
import {
  NotificationChannelProvider,
  SendMessageSpecificProviderDto,
} from '../notification-channel-provider';
import { TelegramOptions } from '../../core/types/telegram-options.type';
import { Logger } from '@logdash/js-sdk';

@Injectable()
export class TelegramNotificationChannelProvider implements NotificationChannelProvider {
  constructor(private readonly logger: Logger) {}

  public async sendMessage(dto: SendMessageSpecificProviderDto): Promise<void> {
    const options: TelegramOptions = dto.notificationChannel.options as TelegramOptions;

    const url = `https://api.telegram.org/bot${options.botToken}/sendMessage`;

    try {
      await axios.post(url, {
        chat_id: options.chatId,
        text: dto.message,
      });
    } catch (error) {
      this.logger.error('Failed to send message to Telegram', {
        error: error.response?.data || error.message,
      });

      throw new Error(`Failed to send message to Telegram: ${error.message}`);
    }
  }
}
