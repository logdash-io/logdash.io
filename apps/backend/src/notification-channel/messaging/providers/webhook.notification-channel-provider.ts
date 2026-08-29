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

const MAX_LOGGED_ERROR_LENGTH = 500;

/**
 * Only the origin reaches the log stream. Webhook urls carry their credential
 * in userinfo, in the query string or, for the common providers, in the path
 * itself (`hooks.slack.com/services/<secret>`), so nothing past the host is
 * safe to write down.
 */
function redactUrl(rawUrl: string): string {
  try {
    return new URL(rawUrl).origin;
  } catch {
    return '<unparseable url>';
  }
}

/**
 * Header values are user supplied and commonly hold an `Authorization` token
 * for the receiver. Names are enough to debug a misconfigured channel.
 */
function headerNames(headers?: Record<string, string>): string[] {
  return headers ? Object.keys(headers) : [];
}

/**
 * The size of what the receiver answered with, for debugging, without the
 * content - the body is attacker controlled and can reflect whatever was sent.
 */
function responseSize(data: unknown): number | undefined {
  if (typeof data === 'string') return data.length;
  if (Buffer.isBuffer(data)) return data.byteLength;
  if (data === undefined || data === null) return undefined;

  try {
    return JSON.stringify(data)?.length;
  } catch {
    return undefined;
  }
}

/**
 * Only the error message, bounded, and with the raw url scrubbed out of it -
 * both axios and the ssrf guard interpolate the url into their messages. The
 * remote response body is never logged; it is attacker controlled and can
 * reflect whatever was sent to it.
 */
function describeError(error: any, rawUrl: string): string {
  const message =
    typeof error?.message === 'string' ? error.message : 'unknown webhook delivery error';

  return message.split(rawUrl).join(redactUrl(rawUrl)).slice(0, MAX_LOGGED_ERROR_LENGTH);
}

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
      // never log the full url, header values or bodies here - all three are
      // user supplied and routinely carry credentials for the receiver
      this.logger.error('Failed to send message to webhook', {
        origin: redactUrl(dto.url),
        method: dto.method,
        headerNames: headerNames(dto.headers),
        statusCode: error.response?.status,
        responseSize: responseSize(error.response?.data),
        error: describeError(error, dto.url),
      });
    }
  }
}
