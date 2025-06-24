import { BadRequestException, Injectable } from '@nestjs/common';
import { NotificationChannelOptions } from './entities/notification-channel.entity';
import { NotificationTarget } from './enums/notification-target.enum';
import { TelegramOptions } from './types/telegram-options.type';
import { NotificationChannelReadService } from '../read/notification-channel-read.service';

@Injectable()
export class NotificationChannelOptionsValidationService {
  constructor(private readonly notificationChannelReadService: NotificationChannelReadService) {}

  public async validateOptions(
    options: NotificationChannelOptions,
    target: NotificationTarget,
    clusterId: string,
  ): Promise<void> {
    if (target === NotificationTarget.Telegram) {
      await this.validateTelegramOptions(options as TelegramOptions, clusterId);
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
}
