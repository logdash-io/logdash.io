import { Injectable } from '@nestjs/common';
import axios from 'axios';
import {
  NotificationsChannelProvider,
  SendMessageSpecificProviderDto,
} from '../notifications-channel-provider';
import { WebhookOptions, WebhookHttpMethod } from '../../core/types/webhook-options.type';
import { Logger } from '@logdash/js-sdk';

@Injectable()
export class WebhookNotificationsChannelProvider implements NotificationsChannelProvider {
  constructor(private readonly logger: Logger) {}

  public async sendMessage(dto: SendMessageSpecificProviderDto): Promise<void> {
    const options: WebhookOptions = dto.notificationsChannel.options as WebhookOptions;

    const method = options.method;
    const headers = options.headers || {};

    try {
      await axios({
        method: method.toLowerCase() as any,
        url: options.url,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        data: {
          message: dto.message,
        },
      });
    } catch (error) {
      this.logger.error('Failed to send message to webhook', {
        error: error.response?.data || error.message,
        url: options.url,
      });

      throw new Error(`Failed to send message to webhook: ${error.message}`);
    }
  }
}
