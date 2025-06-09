import { Module } from '@nestjs/common';
import { TelegramNotificationsChannelProvider } from './providers/telegram.notifications-channel-provider';
import { NotificationsChannelMessagingService } from './notifications-channel-messaging.service';
import { NotificationsChannelReadModule } from '../read/notifications-channel-read.module';

const messagingProviders = [TelegramNotificationsChannelProvider];

@Module({
  imports: [NotificationsChannelReadModule],
  providers: [NotificationsChannelMessagingService, ...messagingProviders],
  exports: [NotificationsChannelMessagingService],
})
export class NotificationsChannelMessagingModule {}
