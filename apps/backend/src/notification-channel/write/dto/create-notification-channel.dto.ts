import { NotificationChannelType } from '../../core/enums/notification-target.enum';
import { TelegramOptions } from '../../core/types/telegram-options.type';
import { WebhookOptions } from '../../core/types/webhook-options.type';

export class CreateNotificationChannelDto {
  clusterId: string;
  type: NotificationChannelType;
  name: string;
  options: TelegramOptions | WebhookOptions;
}
