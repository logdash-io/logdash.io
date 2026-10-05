import { NotificationChannelOptions } from '../../core/entities/notification-channel.entity';

export class UpdateNotificationChannelDto {
  id: string;
  options?: NotificationChannelOptions;
}
