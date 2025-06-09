import { NotificationsChannelNormalized } from '../core/entities/notifications-channel.interface';

export interface SendMessageSpecificProviderDto {
  notificationsChannel: NotificationsChannelNormalized;
  message: string;
}

export interface NotificationsChannelProvider {
  sendMessage(dto: SendMessageSpecificProviderDto): Promise<void>;
}
