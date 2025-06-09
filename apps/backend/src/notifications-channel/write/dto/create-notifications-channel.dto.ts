import { NotificationTarget } from '../../core/enums/notification-target.enum';
import { TelegramOptions } from '../../core/types/telegram-options.type';
import { WebhookOptions } from '../../core/types/webhook-options.type';

export class CreateNotificationsChannelDto {
  clusterId: string;
  type: NotificationTarget;
  options: TelegramOptions | WebhookOptions;
}
