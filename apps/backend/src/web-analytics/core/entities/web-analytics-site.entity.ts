import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import {
  WebAnalyticsFunnelLayout,
  WebAnalyticsFunnelMode,
  WebAnalyticsInsightBucket,
  WebAnalyticsInsightEvent,
  WebAnalyticsInsightFilter,
  WebAnalyticsInsightType,
} from '../dto/web-analytics-insight.body';

@Schema()
export class WebAnalyticsInsightEntity {
  _id: Types.ObjectId;

  @Prop({ required: true })
  type: WebAnalyticsInsightType;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  days: number;

  @Prop()
  mode?: WebAnalyticsFunnelMode;

  @Prop()
  layout?: WebAnalyticsFunnelLayout;

  @Prop({ type: [String], default: undefined })
  steps?: string[];

  @Prop({ type: [Object], default: undefined })
  events?: WebAnalyticsInsightEvent[];

  @Prop({ type: [Object], default: undefined })
  filters?: WebAnalyticsInsightFilter[];

  @Prop()
  bucket?: WebAnalyticsInsightBucket;

  @Prop()
  property?: string;

  @Prop()
  binSize?: number;
}

export const WebAnalyticsInsightSchema = SchemaFactory.createForClass(WebAnalyticsInsightEntity);

@Schema({ collection: 'webAnalyticsSites', timestamps: true })
export class WebAnalyticsSiteEntity {
  _id: Types.ObjectId;

  @Prop({ required: true })
  clusterId: string;

  @Prop({ type: [String], required: true })
  origins: string[];

  @Prop({ type: [String], default: [] })
  goals?: string[];

  @Prop({ type: [WebAnalyticsInsightSchema], default: [] })
  insights?: WebAnalyticsInsightEntity[];
}

export const WebAnalyticsSiteSchema = SchemaFactory.createForClass(WebAnalyticsSiteEntity);

WebAnalyticsSiteSchema.index({ clusterId: 1 }, { unique: true });
