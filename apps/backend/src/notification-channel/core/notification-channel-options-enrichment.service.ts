import { Injectable } from '@nestjs/common';
import { NotificationChannelWriteService } from '../write/notification-channel-write.service';
import { NotificationChannelOptions } from './entities/notification-channel.entity';
import { TelegramOptions } from './types/telegram-options.type';
import { NotificationTarget } from './enums/notification-target.enum';
import { getEnvConfig } from '../../shared/configs/env-configs';

@Injectable()
export class NotificationChannelOptionsEnrichmentService {
  constructor() {}

  public async enrichOptions(
    options: NotificationChannelOptions,
    target: NotificationTarget,
  ): Promise<NotificationChannelOptions> {
    if (target === NotificationTarget.Telegram) {
      return this.enrichTelegramOptions(options as TelegramOptions);
    }

    return options;
  }

  private async enrichTelegramOptions(options: TelegramOptions): Promise<TelegramOptions> {
    if (!options.botToken) {
      options.botToken = getEnvConfig().notificationChannels.telegramUptimeBot.token;
    }

    return options;
  }
}
