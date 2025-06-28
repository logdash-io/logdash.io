import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional } from 'class-validator';
import { NotificationChannelType } from '../enums/notification-target.enum';
import { TelegramOptions } from '../types/telegram-options.type';
import { WebhookOptions } from '../types/webhook-options.type';

export class UpdateNotificationChannelBody {
  @ApiPropertyOptional({ enum: NotificationChannelType })
  @IsEnum(NotificationChannelType)
  @IsOptional()
  public type?: NotificationChannelType;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  public options?: TelegramOptions | WebhookOptions;
}
