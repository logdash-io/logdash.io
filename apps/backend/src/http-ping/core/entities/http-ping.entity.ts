import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ collection: 'httpPings', timestamps: true })
export class HttpPingEntity {
  _id: Types.ObjectId;

  @Prop()
  httpMonitorId: string;

  @Prop()
  statusCode: number;

  @Prop()
  responseTimeMs: number;

  @Prop()
  message: string;

  createdAt: Date;
  updatedAt: Date;
}

export type HttpPingDocument = HydratedDocument<HttpPingEntity>;

export const HttpPingSchema = SchemaFactory.createForClass(HttpPingEntity);
