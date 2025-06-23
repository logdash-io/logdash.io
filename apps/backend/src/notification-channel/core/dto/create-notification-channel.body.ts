import { ApiExtraModels, ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { NotificationTarget } from '../enums/notification-target.enum';
import { TelegramOptionsValidator } from '../types/telegram-options.type';
import { WebhookOptionsValidator } from '../types/webhook-options.type';
import { Transform } from 'class-transformer';

@ApiExtraModels(TelegramOptionsValidator, WebhookOptionsValidator)
export class CreateNotificationChannelBody {
  @ApiProperty({ enum: NotificationTarget })
  @IsEnum(NotificationTarget)
  public type: NotificationTarget;

  @ApiProperty({ description: 'Display name for the notification channel' })
  @MaxLength(1024)
  @IsString()
  public name: string;

  @ApiProperty({
    oneOf: [
      { $ref: getSchemaPath(TelegramOptionsValidator) },
      { $ref: getSchemaPath(WebhookOptionsValidator) },
    ],
  })
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
  public options: TelegramOptionsValidator | WebhookOptionsValidator;
}
