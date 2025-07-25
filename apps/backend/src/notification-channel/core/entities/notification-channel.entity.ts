import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { NotificationChannelType } from '../enums/notification-target.enum';
import { TelegramOptions } from '../types/telegram-options.type';
import { WebhookOptions } from '../types/webhook-options.type';

export type NotificationChannelOptions = TelegramOptions | WebhookOptions;

@Schema({ collection: 'notificationChannels', timestamps: true })
export class NotificationChannelEntity {
  _id: Types.ObjectId;

  @Prop({ type: String })
  clusterId: string;

  @Prop({ type: String, enum: NotificationChannelType })
  target: NotificationChannelType;

  @Prop({ type: String })
  name: string;

  @Prop({ type: Object })
  options: NotificationChannelOptions;

  createdAt: Date;
  updatedAt: Date;
}

export type NotificationChannelDocument = HydratedDocument<NotificationChannelEntity>;

export const NotificationChannelSchema = SchemaFactory.createForClass(NotificationChannelEntity);
