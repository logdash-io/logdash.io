import { BadRequestException, Injectable } from '@nestjs/common';
import { NotificationChannelOptions } from './entities/notification-channel.entity';
import { NotificationChannelType } from './enums/notification-target.enum';
import { TelegramOptions } from './types/telegram-options.type';
import { WebhookOptions, WebhookHttpMethod } from './types/webhook-options.type';
import { NotificationChannelReadService } from '../read/notification-channel-read.service';
import { UserTier } from '../../user/core/enum/user-tier.enum';

@Injectable()
export class NotificationChannelOptionsValidationService {
  constructor(private readonly notificationChannelReadService: NotificationChannelReadService) {}

  public async validateOptions(
    options: NotificationChannelOptions,
    target: NotificationChannelType,
    clusterId: string,
    userTier?: UserTier,
  ): Promise<void> {
    if (target === NotificationChannelType.Telegram) {
      await this.validateTelegramOptions(options as TelegramOptions, clusterId);
    }

    if (target === NotificationChannelType.Webhook) {
      this.validateWebhookOptions(options as WebhookOptions, userTier);
    }
  }

  private async validateTelegramOptions(
    options: TelegramOptions,
    clusterId: string,
  ): Promise<void> {
    const existingChannel =
      await this.notificationChannelReadService.readExistingTelegramChannelByChatIdAndClusterId(
        options.chatId,
        clusterId,
      );

    if (existingChannel) {
      throw new BadRequestException('Channel with this chatId already exists');
    }
  }

  private validateWebhookOptions(options: WebhookOptions, userTier?: UserTier): void {
    if (userTier === UserTier.Free) {
      if (options.method && options.method !== WebhookHttpMethod.GET) {
        throw new BadRequestException(
          'Free tier users can only use GET method for webhooks. Upgrade to use other HTTP methods.',
        );
      }

      if (options.headers && Object.keys(options.headers).length > 0) {
        throw new BadRequestException(
          'Free tier users cannot use custom headers for webhooks. Upgrade to use custom headers.',
        );
      }
    }
  }
}
