import { Module } from '@nestjs/common';
import { TelegramNotificationChannelProvider } from './providers/telegram.notification-channel-provider';
import { NotificationChannelMessagingService } from './notification-channel-messaging.service';
import { NotificationChannelReadModule } from '../read/notification-channel-read.module';
import { WebhookNotificationChannelProvider } from './providers/webhook.notification-channel-provider';

const messagingProviders = [
  TelegramNotificationChannelProvider,
  WebhookNotificationChannelProvider,
];

@Module({
  imports: [NotificationChannelReadModule],
  providers: [NotificationChannelMessagingService, ...messagingProviders],
  exports: [NotificationChannelMessagingService],
})
export class NotificationChannelMessagingModule {}
