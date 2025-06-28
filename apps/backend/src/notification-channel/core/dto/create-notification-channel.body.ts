import { ApiExtraModels, ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { NotificationChannelType } from '../enums/notification-target.enum';
import { TelegramOptionsValidator } from '../types/telegram-options.type';
import { WebhookOptionsValidator } from '../types/webhook-options.type';
import { Transform } from 'class-transformer';

@ApiExtraModels(TelegramOptionsValidator, WebhookOptionsValidator)
export class CreateNotificationChannelBody {
  @ApiProperty({ enum: NotificationChannelType })
  @IsEnum(NotificationChannelType)
  public type: NotificationChannelType;

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
    if (obj.type === NotificationChannelType.Telegram) {
      return Object.assign(new TelegramOptionsValidator(), value);
    }
    if (obj.type === NotificationChannelType.Webhook) {
      return Object.assign(new WebhookOptionsValidator(), value);
    }
    return value;
  })
  @IsObject()
  public options: TelegramOptionsValidator | WebhookOptionsValidator;
}
