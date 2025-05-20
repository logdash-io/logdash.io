import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ collection: 'httpMonitors', timestamps: true })
export class HttpMonitorEntity {
  _id: Types.ObjectId;

  @Prop({ required: true })
  clusterId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  url: string;

  createdAt: Date;
  updatedAt: Date;
}

export type HttpMonitorDocument = HydratedDocument<HttpMonitorEntity>;

export const HttpMonitorSchema = SchemaFactory.createForClass(HttpMonitorEntity);
