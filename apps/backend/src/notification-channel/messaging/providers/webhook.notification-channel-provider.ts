import { Inject, Injectable } from '@nestjs/common';
import { safeHttpRequest } from '../../../shared/ssrf/safe-http-request';
import {
  NotificationChannelProvider,
  SendHttpMonitorAlertMessageSpecificProviderDto,
  SendWelcomeMessageSpecificProviderDto,
} from '../notification-channel-provider';
import { LogdashLogger } from '../../../shared/logdash/aggregate-logger';
import { NOTIFICATIONS_LOGGER } from '../../../shared/logdash/logdash-tokens';
import { WebhookHttpMethod, WebhookOptions } from '../../core/types/webhook-options.type';

const METHODS_WITH_BODY: WebhookHttpMethod[] = [
  WebhookHttpMethod.POST,
  WebhookHttpMethod.PUT,
  WebhookHttpMethod.PATCH,
];

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
      if (!Object.values(WebhookHttpMethod).includes(dto.method)) {
        throw new Error(`Unsupported HTTP method: ${dto.method}`);
      }

      await safeHttpRequest({
        url: dto.url,
        method: dto.method,
        headers: dto.headers,
        data: METHODS_WITH_BODY.includes(dto.method) ? dto.bodyToSend : undefined,
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
