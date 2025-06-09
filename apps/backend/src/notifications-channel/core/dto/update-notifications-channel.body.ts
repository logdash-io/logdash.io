import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional } from 'class-validator';
import { NotificationTarget } from '../enums/notification-target.enum';
import { TelegramOptions } from '../types/telegram-options.type';
import { WebhookOptions } from '../types/webhook-options.type';

export class UpdateNotificationsChannelBody {
  @ApiPropertyOptional({ enum: NotificationTarget })
  @IsEnum(NotificationTarget)
  @IsOptional()
  public type?: NotificationTarget;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  public options?: TelegramOptions | WebhookOptions;
}
