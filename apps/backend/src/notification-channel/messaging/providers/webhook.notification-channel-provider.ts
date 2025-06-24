import { Injectable } from '@nestjs/common';
import axios from 'axios';
import {
  NotificationChannelProvider,
  SendHttpMonitorAlertMessageSpecificProviderDto,
  SendWelcomeMessageSpecificProviderDto,
} from '../notification-channel-provider';
import { Logger } from '@logdash/js-sdk';
import { WebhookOptions } from '../../core/types/webhook-options.type';

@Injectable()
export class WebhookNotificationChannelProvider implements NotificationChannelProvider {
  constructor(private readonly logger: Logger) {}

  public async sendHttpMonitorAlertMessage(
    dto: SendHttpMonitorAlertMessageSpecificProviderDto,
  ): Promise<void> {
    const body = {
      httpMonitorId: dto.httpMonitorId,
      newStatus: dto.newStatus,
      name: dto.name,
      url: dto.url,
      errorMessage: dto.errorMessage,
      statusCode: dto.statusCode,
    };

    const webhookOptions = dto.notificationChannel.options as WebhookOptions;

    await this.sendMessageToWebhook({
      url: webhookOptions.url,
      headers: webhookOptions.headers,
      bodyToSend: body,
    });
  }

  public async sendWelcomeMessage(dto: SendWelcomeMessageSpecificProviderDto): Promise<void> {
    return;
  }

  private async sendMessageToWebhook(dto: {
    url: string;
    headers?: Record<string, string>;
    bodyToSend: any;
  }) {
    try {
      await axios.post(dto.url, dto.bodyToSend, {
        headers: dto.headers,
      });
    } catch (error) {
      this.logger.error('Failed to send message to webhook', {
        url: dto.url,
        headers: dto.headers,
        bodyToSend: dto.bodyToSend,
        error: error.response?.data || error.message,
      });
    }
  }
}
