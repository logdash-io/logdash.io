import { Injectable } from '@nestjs/common';
import { NotificationChannelProvider } from './notification-channel-provider';
import { NotificationChannelReadService } from '../read/notification-channel-read.service';
import { NotificationChannelType } from '../core/enums/notification-target.enum';
import { TelegramNotificationChannelProvider } from './providers/telegram.notification-channel-provider';
import { NotificationChannelNormalized } from '../core/entities/notification-channel.interface';
import { Logger } from '@logdash/js-sdk';
import { SendHttpMonitorAlertMessageDto } from './dto/send-http-monitor-alert-message.dto';
import { WebhookNotificationChannelProvider } from './providers/webhook.notification-channel-provider';

@Injectable()
export class NotificationChannelMessagingService {
  constructor(
    private readonly telegramMessagingProvider: TelegramNotificationChannelProvider,
    private readonly webhookMessagingProvider: WebhookNotificationChannelProvider,
    private readonly notificationChannelReadService: NotificationChannelReadService,
    private readonly logger: Logger,
  ) {}

  public async sendHttpMonitorAlertMessage(dto: SendHttpMonitorAlertMessageDto): Promise<void> {
    const channels = await this.notificationChannelReadService.readByIds(
      dto.notificationChannelsIds,
    );

    await Promise.all(
      channels.map((channel) =>
        this.sendHttpMonitorAlertMessageToNotificationChannel(channel, dto),
      ),
    );
  }

  public async sendWelcomeMessage(notificationChannelId: string): Promise<void> {
    const channel = await this.notificationChannelReadService.readById(notificationChannelId);

    if (!channel) {
      throw new Error('Channel not found');
    }

    const provider = this.pickProvider(channel.target);
    await provider.sendWelcomeMessage({ notificationChannel: channel });
  }

  private async sendHttpMonitorAlertMessageToNotificationChannel(
    channel: NotificationChannelNormalized,
    dto: SendHttpMonitorAlertMessageDto,
  ): Promise<void> {
    const provider = this.pickProvider(channel.target);
    await provider.sendHttpMonitorAlertMessage({ notificationChannel: channel, ...dto });
  }

  private pickProvider(target: NotificationChannelType): NotificationChannelProvider {
    if (target === NotificationChannelType.Telegram) {
      return this.telegramMessagingProvider;
    }

    if (target === NotificationChannelType.Webhook) {
      return this.webhookMessagingProvider;
    }

    this.logger.error('No provider found for notification target', {
      notificationChannel: target,
    });

    throw new Error(`No provider found for notification target: ${target}`);
  }
}
