import { Inject, Injectable } from '@nestjs/common';
import axios from 'axios';
import {
  NotificationChannelProvider,
  SendHttpMonitorAlertMessageSpecificProviderDto,
  SendWelcomeMessageSpecificProviderDto,
} from '../notification-channel-provider';
import { LogdashLogger } from '../../../shared/logdash/aggregate-logger';
import { NOTIFICATIONS_LOGGER } from '../../../shared/logdash/logdash-tokens';
import { WebhookHttpMethod, WebhookOptions } from '../../core/types/webhook-options.type';

@Injectable()
export class WebhookNotificationChannelProvider implements NotificationChannelProvider {
  constructor(@Inject(NOTIFICATIONS_LOGGER) private readonly logger: LogdashLogger) {}

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
      method: webhookOptions.method ?? WebhookHttpMethod.GET,
      bodyToSend: body,
    });
  }

  public async sendWelcomeMessage(dto: SendWelcomeMessageSpecificProviderDto): Promise<void> {
    return;
  }

  private async sendMessageToWebhook(dto: {
    url: string;
    method: WebhookHttpMethod;
    headers?: Record<string, string>;
    bodyToSend: any;
  }) {
    try {
      switch (dto.method) {
        case WebhookHttpMethod.POST:
          await axios.post(dto.url, dto.bodyToSend, {
            headers: dto.headers,
          });
          break;
        case WebhookHttpMethod.GET:
          await axios.get(dto.url, {
            headers: dto.headers,
          });
          break;
        case WebhookHttpMethod.PUT:
          await axios.put(dto.url, dto.bodyToSend, {
            headers: dto.headers,
          });
          break;
        case WebhookHttpMethod.DELETE:
          await axios.delete(dto.url, {
            headers: dto.headers,
          });
          break;
        case WebhookHttpMethod.PATCH:
          await axios.patch(dto.url, dto.bodyToSend, {
            headers: dto.headers,
          });
          break;
        case WebhookHttpMethod.OPTIONS:
          await axios.options(dto.url, {
            headers: dto.headers,
          });
          break;
        case WebhookHttpMethod.HEAD:
          await axios.head(dto.url, {
            headers: dto.headers,
          });
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${dto.method}`);
      }
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
