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
import { TelegramSetupService } from '../setup/telegram/telegram-setup.service';
import { getEnvConfig } from '../../shared/configs/env-configs';

@Injectable()
export class NotificationChannelOptionsValidationService {
  constructor(
    private readonly notificationChannelReadService: NotificationChannelReadService,
    private readonly telegramSetupService: TelegramSetupService,
  ) {}

  public async validateOptions(
    options: NotificationChannelOptions,
    target: NotificationChannelType,
    clusterId: string,
    userId: string,
    userTier?: UserTier,
    excludeNotificationChannelId?: string,
  ): Promise<void> {
    this.validateOptionsShape(options, target);

    if (target === NotificationChannelType.Telegram) {
      await this.validateTelegramOptions(
        options as TelegramOptions,
        clusterId,
        userId,
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
    userId: string,
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

    if (options.botToken) {
      return;
    }

    // The built-in bot can post to every chat that ever started it, so it only
    // targets a chat this user proved with the setup passphrase. A channel that
    // already sends to this chat through the built-in bot keeps it.
    const defaultBotToken = getEnvConfig().notificationChannels.telegramUptimeBot.token;
    const existingBotToken = (existingChannel?.options as TelegramOptions | undefined)?.botToken;
    const keepsDefaultBotChat =
      existingChannel !== null && (!existingBotToken || existingBotToken === defaultBotToken);

    if (
      !keepsDefaultBotChat &&
      !(await this.telegramSetupService.isChatLinkedToUser(options.chatId, userId))
    ) {
      throw new BadRequestException(
        'Send the setup passphrase in this chat before connecting it to the logdash bot',
      );
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
