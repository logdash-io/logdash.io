import { NotificationChannelNormalized } from '../core/entities/notification-channel.interface';

export interface SendMessageSpecificProviderDto {
  notificationChannel: NotificationChannelNormalized;
  message: string;
}

export interface NotificationChannelProvider {
  sendMessage(dto: SendMessageSpecificProviderDto): Promise<void>;
}
