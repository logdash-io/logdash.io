import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsObject, IsString, ValidateNested } from 'class-validator';
import { NotificationTarget } from '../enums/notification-target.enum';
import { TelegramOptions, TelegramOptionsValidator } from '../types/telegram-options.type';
import { WebhookOptions, WebhookOptionsValidator } from '../types/webhook-options.type';
import { Transform } from 'class-transformer';

export class CreateNotificationsChannelBody {
  @ApiProperty({ enum: NotificationTarget })
  @IsEnum(NotificationTarget)
  public type: NotificationTarget;

  @ApiProperty()
  @ValidateNested()
  @Transform(({ obj, value }) => {
    if (obj.type === NotificationTarget.Telegram) {
      return Object.assign(new TelegramOptionsValidator(), value);
    }
    if (obj.type === NotificationTarget.Webhook) {
      return Object.assign(new WebhookOptionsValidator(), value);
    }
    return value;
  })
  @IsObject()
  public options: TelegramOptions | WebhookOptions;
}
