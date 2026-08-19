import { ApiExtraModels, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsObject, IsOptional, ValidateIf, ValidateNested } from 'class-validator';
import { NotificationChannelType } from '../enums/notification-target.enum';
import { TelegramOptionsValidator } from '../types/telegram-options.type';
import { WebhookOptionsValidator } from '../types/webhook-options.type';

@ApiExtraModels(TelegramOptionsValidator, WebhookOptionsValidator)
export class UpdateNotificationChannelBody {
  @ApiPropertyOptional({ enum: NotificationChannelType })
  @IsEnum(NotificationChannelType)
  @IsOptional()
  public type?: NotificationChannelType;

  @ApiPropertyOptional({
    oneOf: [
      { $ref: getSchemaPath(TelegramOptionsValidator) },
      { $ref: getSchemaPath(WebhookOptionsValidator) },
    ],
  })
  @IsOptional()
  // only discriminable when the body states the type; the authoritative check
  // runs in NotificationChannelOptionsValidationService against the stored type
  @ValidateIf((body) => body.type !== undefined)
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
  public options?: TelegramOptionsValidator | WebhookOptionsValidator;
}
