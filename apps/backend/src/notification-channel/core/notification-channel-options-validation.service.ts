import { BadRequestException, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { NotificationChannelOptions } from './entities/notification-channel.entity';
import { NotificationChannelType } from './enums/notification-target.enum';
import { TelegramOptions, TelegramOptionsValidator } from './types/telegram-options.type';
import {
  WebhookOptions,
  WebhookOptionsValidator,
  WebhookHttpMethod,
} from './types/webhook-options.type';
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
    excludeNotificationChannelId?: string,
  ): Promise<void> {
    this.validateOptionsShape(options, target);

    if (target === NotificationChannelType.Telegram) {
      await this.validateTelegramOptions(
        options as TelegramOptions,
        clusterId,
        excludeNotificationChannelId,
      );
    }

    if (target === NotificationChannelType.Webhook) {
      this.validateWebhookOptions(options as WebhookOptions, userTier);
    }
  }

  /**
   * Structural validation keyed on the authoritative channel type rather than
   * on whatever the request body claimed, so the update path cannot smuggle in
   * options the create path would have rejected.
   */
  private validateOptionsShape(
    options: NotificationChannelOptions,
    target: NotificationChannelType,
  ): void {
    const instance =
      target === NotificationChannelType.Telegram
        ? plainToInstance(TelegramOptionsValidator, options)
        : plainToInstance(WebhookOptionsValidator, options);

    const errors = validateSync(instance);

    if (errors.length > 0) {
      throw new BadRequestException(
        errors.flatMap((error) => Object.values(error.constraints ?? {})),
      );
    }
  }

  private async validateTelegramOptions(
    options: TelegramOptions,
    clusterId: string,
    excludeNotificationChannelId?: string,
  ): Promise<void> {
    const existingChannel =
      await this.notificationChannelReadService.readExistingTelegramChannelByChatIdAndClusterId(
        options.chatId,
        clusterId,
      );

    if (existingChannel && existingChannel.id !== excludeNotificationChannelId) {
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
