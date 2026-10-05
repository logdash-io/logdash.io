import { NotificationChannelType } from '../../core/enums/notification-target.enum';
import { NotificationChannelOptions } from '../../core/entities/notification-channel.entity';

export class CreateNotificationChannelDto {
  clusterId: string;
  type: NotificationChannelType;
  name: string;
  options: NotificationChannelOptions;
}
