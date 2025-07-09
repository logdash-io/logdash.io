import { Injectable } from '@nestjs/common';
import axios from 'axios';
import {
  NotificationChannelProvider,
  SendHttpMonitorAlertMessageSpecificProviderDto,
  SendWelcomeMessageSpecificProviderDto,
} from '../notification-channel-provider';
import { TelegramOptions } from '../../core/types/telegram-options.type';
import { Logger } from '@logdash/js-sdk';
import { HttpMonitorStatus } from '../../../http-monitor/status/enum/http-monitor-status.enum';

@Injectable()
export class TelegramNotificationChannelProvider implements NotificationChannelProvider {
  constructor(private readonly logger: Logger) {}

  public async sendHttpMonitorAlertMessage(
    dto: SendHttpMonitorAlertMessageSpecificProviderDto,
  ): Promise<void> {
    const options: TelegramOptions = dto.notificationChannel.options as TelegramOptions;

    await this.sendMessageToTelegramApi({
      botToken: options.botToken!,
      chatId: options.chatId,
      message: this.createHttpMonitorAlertMessage(dto),
    });
  }

  public async sendWelcomeMessage(dto: SendWelcomeMessageSpecificProviderDto): Promise<void> {
    const options: TelegramOptions = dto.notificationChannel.options as TelegramOptions;

    await this.sendMessageToTelegramApi({
      botToken: options.botToken!,
      chatId: options.chatId,
      message: this.createWelcomeMessage(dto),
    });
  }

  private createWelcomeMessage(dto: SendWelcomeMessageSpecificProviderDto): string {
    return `👋 Hi\\! I'm \`logdash-uptime-bot\`
Setup was completed successfully

I'll notify you about the status of your services`;
  }

  private createHttpMonitorAlertMessage(
    dto: SendHttpMonitorAlertMessageSpecificProviderDto,
  ): string {
    const codeBlock = '```';

    if (dto.newStatus === HttpMonitorStatus.Down) {
      return `🔴  *${dto.name}* is down
${codeBlock}
Status code: ${dto.statusCode ?? 'N/A'}
Error: ${this.escapeTelegramString(dto.errorMessage ?? 'N/A')}
${codeBlock}`;
    }

    return `🟢  *${this.escapeTelegramString(dto.name)}* is up`;
  }

  private escapeTelegramString(message: string): string {
    const SPECIAL_CHARS = [
      '\\',
      '_',
      '*',
      '[',
      ']',
      '(',
      ')',
      '~',
      '`',
      '>',
      '<',
      '&',
      '#',
      '+',
      '-',
      '=',
      '|',
      '{',
      '}',
      '.',
      '!',
    ];

    SPECIAL_CHARS.forEach((char) => (message = message.replaceAll(char, `\\${char}`)));
    return message;
  }

  private async sendMessageToTelegramApi(dto: {
    botToken: string;
    chatId: string;
    message: string;
  }) {
    const url = `https://api.telegram.org/bot${dto.botToken}/sendMessage?parse_mode=MarkdownV2`;

    try {
      await axios.post(url, {
        chat_id: dto.chatId,
        text: dto.message,
      });
    } catch (error) {
      this.logger.error('Failed to send message to Telegram', {
        error: error.response?.data || error.message,
      });
    }
  }
}
