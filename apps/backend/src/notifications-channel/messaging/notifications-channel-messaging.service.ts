import { Injectable } from '@nestjs/common';
import { NotificationsChannelProvider } from './notifications-channel-provider';
import { NotificationsChannelReadService } from '../read/notifications-channel-read.service';
import { NotificationTarget } from '../core/enums/notification-target.enum';
import { TelegramNotificationsChannelProvider } from './providers/telegram.notifications-channel-provider';
import { WebhookNotificationsChannelProvider } from './providers/webhook.notifications-channel-provider';
import { NotificationsChannelNormalized } from '../core/entities/notifications-channel.interface';
import { Logger } from '@logdash/js-sdk';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class NotificationsChannelMessagingService {
  constructor(
    private readonly telegramMessagingProvider: TelegramNotificationsChannelProvider,
    private readonly webhookMessagingProvider: WebhookNotificationsChannelProvider,
    private readonly notificationsChannelReadService: NotificationsChannelReadService,
    private readonly logger: Logger,
  ) {}

  public async sendMessage(dto: SendMessageDto): Promise<void> {
    const channels = await this.notificationsChannelReadService.readByIds(
      dto.notificationsChannelIds,
    );

    await Promise.all(
      channels.map((channel) => this.sendMessageToNotificationsChannel(channel, dto.message)),
    );
  }

  private async sendMessageToNotificationsChannel(
    channel: NotificationsChannelNormalized,
    message: string,
  ): Promise<void> {
    const provider = this.pickProvider(channel.target);
    await provider.sendMessage({ notificationsChannel: channel, message });
  }

  private pickProvider(target: NotificationTarget): NotificationsChannelProvider {
    if (target === NotificationTarget.Telegram) {
      return this.telegramMessagingProvider;
    }

    if (target === NotificationTarget.Webhook) {
      return this.webhookMessagingProvider;
    }

    this.logger.error('No provider found for notification target', {
      notificationsChannel: target,
    });

    throw new Error(`No provider found for notification target: ${target}`);
  }
}
