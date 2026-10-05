import { Module } from '@nestjs/common';
import { TelegramNotificationChannelProvider } from './providers/telegram.notification-channel-provider';
import { NotificationChannelMessagingService } from './notification-channel-messaging.service';
import { NotificationChannelReadModule } from '../read/notification-channel-read.module';
import { WebhookNotificationChannelProvider } from './providers/webhook.notification-channel-provider';
import { EmailNotificationChannelProvider } from './providers/email.notification-channel-provider';
import { ResendModule } from '../../email/resend/resend.module';

const messagingProviders = [
  TelegramNotificationChannelProvider,
  WebhookNotificationChannelProvider,
  EmailNotificationChannelProvider,
];

@Module({
  imports: [NotificationChannelReadModule, ResendModule],
  providers: [NotificationChannelMessagingService, ...messagingProviders],
  exports: [NotificationChannelMessagingService],
})
export class NotificationChannelMessagingModule {}
