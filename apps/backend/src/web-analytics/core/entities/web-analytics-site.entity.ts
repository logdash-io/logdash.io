import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ collection: 'webAnalyticsSites', timestamps: true })
export class WebAnalyticsSiteEntity {
  _id: Types.ObjectId;

  @Prop({ required: true })
  clusterId: string;

  @Prop({ type: [String], required: true })
  origins: string[];
}

export const WebAnalyticsSiteSchema = SchemaFactory.createForClass(WebAnalyticsSiteEntity);

WebAnalyticsSiteSchema.index({ clusterId: 1 }, { unique: true });
