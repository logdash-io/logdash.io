import { Injectable } from '@nestjs/common';
import { NotificationChannelOptions } from './entities/notification-channel.entity';
import { TelegramOptions } from './types/telegram-options.type';
import { NotificationChannelType } from './enums/notification-target.enum';
import { getEnvConfig } from '../../shared/configs/env-configs';

@Injectable()
export class NotificationChannelOptionsEnrichmentService {
  constructor() {}

  public async enrichOptions(
    options: NotificationChannelOptions,
    target: NotificationChannelType,
  ): Promise<NotificationChannelOptions> {
    const optionsDeepCopy = structuredClone(options);

    if (target === NotificationChannelType.Telegram) {
      return this.enrichTelegramOptions(optionsDeepCopy as TelegramOptions);
    }

    return optionsDeepCopy;
  }

  private async enrichTelegramOptions(options: TelegramOptions): Promise<TelegramOptions> {
    if (!options.botToken) {
      options.botToken = getEnvConfig().notificationChannels.telegramUptimeBot.token;
    }

    return options;
  }
}
