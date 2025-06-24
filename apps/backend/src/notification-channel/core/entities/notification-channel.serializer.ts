import { getEnvConfig } from '../../../shared/configs/env-configs';
import { TelegramOptions } from '../types/telegram-options.type';
import { NotificationChannelEntity } from './notification-channel.entity';
import {
  NotificationChannelNormalized,
  NotificationChannelSerialized,
} from './notification-channel.interface';
import { NotificationTarget } from '../enums/notification-target.enum';

export class NotificationChannelSerializer {
  public static normalize(entity: NotificationChannelEntity): NotificationChannelNormalized {
    return {
      id: entity._id.toString(),
      clusterId: entity.clusterId,
      target: entity.target,
      name: entity.name,
      options: entity.options,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  public static serialize(
    normalized: NotificationChannelNormalized,
  ): NotificationChannelSerialized {
    const target = normalized.target;

    if (target === NotificationTarget.Telegram) {
      normalized.options = NotificationChannelSerializer.serializeTelegramOptions(
        normalized.options as TelegramOptions,
      );
    }

    return {
      id: normalized.id,
      clusterId: normalized.clusterId,
      target: normalized.target,
      name: normalized.name,
      options: normalized.options,
      createdAt: normalized.createdAt,
      updatedAt: normalized.updatedAt,
    };
  }

  public static serializeTelegramOptions(options: TelegramOptions): TelegramOptions {
    return {
      ...options,
      botToken:
        options.botToken === getEnvConfig().notificationChannels.telegramUptimeBot.token
          ? undefined
          : options.botToken,
    };
  }
}
