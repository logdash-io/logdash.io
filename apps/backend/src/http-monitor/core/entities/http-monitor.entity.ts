import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { HttpMonitorMode } from '../enums/http-monitor-mode.enum';

@Schema({ collection: 'httpMonitors', timestamps: true })
export class HttpMonitorEntity {
  _id: Types.ObjectId;

  @Prop({ required: true })
  projectId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: false })
  url?: string;

  @Prop({ required: true })
  notificationChannelsIds: string[];

  @Prop({ required: true, enum: HttpMonitorMode, default: HttpMonitorMode.Pull })
  mode: HttpMonitorMode;

  createdAt: Date;
  updatedAt: Date;
}

export type HttpMonitorDocument = HydratedDocument<HttpMonitorEntity>;

export const HttpMonitorSchema = SchemaFactory.createForClass(HttpMonitorEntity);
