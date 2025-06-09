import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { NotificationTarget } from '../enums/notification-target.enum';
import { TelegramOptions } from '../types/telegram-options.type';
import { WebhookOptions } from '../types/webhook-options.type';

export type NotificationsChannelOptions = TelegramOptions | WebhookOptions;

@Schema({ collection: 'notificationsChannels', timestamps: true })
export class NotificationsChannelEntity {
  _id: Types.ObjectId;

  @Prop({ type: String })
  clusterId: string;

  @Prop({ type: String, enum: NotificationTarget })
  target: NotificationTarget;

  @Prop({ type: Object })
  options: NotificationsChannelOptions;

  createdAt: Date;
  updatedAt: Date;
}

export type NotificationsChannelDocument = HydratedDocument<NotificationsChannelEntity>;

export const NotificationsChannelSchema = SchemaFactory.createForClass(NotificationsChannelEntity);
