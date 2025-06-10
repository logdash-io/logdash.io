import { Module } from '@nestjs/common';
import { TelegramNotificationChannelProvider } from './providers/telegram.notification-channel-provider';
import { NotificationChannelMessagingService } from './notification-channel-messaging.service';
import { NotificationChannelReadModule } from '../read/notification-channel-read.module';

const messagingProviders = [TelegramNotificationChannelProvider];

@Module({
  imports: [NotificationChannelReadModule],
  providers: [NotificationChannelMessagingService, ...messagingProviders],
  exports: [NotificationChannelMessagingService],
})
export class NotificationChannelMessagingModule {}
