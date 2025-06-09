import { Injectable } from '@nestjs/common';
import { NotificationChannelProvider } from './notification-channel-provider';
import { NotificationChannelReadService } from '../read/notification-channel-read.service';
import { NotificationTarget } from '../core/enums/notification-target.enum';
import { TelegramNotificationChannelProvider } from './providers/telegram.notification-channel-provider';
import { NotificationChannelNormalized } from '../core/entities/notification-channel.interface';
import { Logger } from '@logdash/js-sdk';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class NotificationChannelMessagingService {
  constructor(
    private readonly telegramMessagingProvider: TelegramNotificationChannelProvider,
    private readonly notificationChannelReadService: NotificationChannelReadService,
    private readonly logger: Logger,
  ) {}

  public async sendMessage(dto: SendMessageDto): Promise<void> {
    const channels = await this.notificationChannelReadService.readByIds(
      dto.notificationChannelIds,
    );

    await Promise.all(
      channels.map((channel) => this.sendMessageToNotificationChannel(channel, dto.message)),
    );
  }

  private async sendMessageToNotificationChannel(
    channel: NotificationChannelNormalized,
    message: string,
  ): Promise<void> {
    const provider = this.pickProvider(channel.target);
    await provider.sendMessage({ notificationChannel: channel, message });
  }

  private pickProvider(target: NotificationTarget): NotificationChannelProvider {
    if (target === NotificationTarget.Telegram) {
      return this.telegramMessagingProvider;
    }

    this.logger.error('No provider found for notification target', {
      notificationChannel: target,
    });

    throw new Error(`No provider found for notification target: ${target}`);
  }
}
