import { TelegramOptions } from '../../core/types/telegram-options.type';
import { WebhookOptions } from '../../core/types/webhook-options.type';

export class UpdateNotificationChannelDto {
  id: string;
  options?: TelegramOptions | WebhookOptions;
}
