import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import {
  WebAnalyticsFunnelLayout,
  WebAnalyticsFunnelMode,
  WebAnalyticsInsightBucket,
  WebAnalyticsInsightConfig,
  WebAnalyticsInsightEvent,
  WebAnalyticsInsightFilter,
  WebAnalyticsInsightMeasure,
  WebAnalyticsInsightType,
} from '../dto/web-analytics-insight.body';

@Schema({ _id: false })
export class WebAnalyticsInsightGridEntity {
  @Prop({ required: true })
  x: number;

  @Prop({ required: true })
  y: number;

  @Prop({ required: true })
  w: number;

  @Prop({ required: true })
  h: number;
}

export const WebAnalyticsInsightGridSchema = SchemaFactory.createForClass(
  WebAnalyticsInsightGridEntity,
);

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
  measure?: WebAnalyticsInsightMeasure;

  @Prop()
  property?: string;

  @Prop()
  binSize?: number;

  @Prop({ type: [Object], default: undefined })
  tabs?: WebAnalyticsInsightConfig[];

  @Prop()
  view?: string;

  @Prop()
  hidden?: boolean;

  @Prop({ type: WebAnalyticsInsightGridSchema })
  grid?: WebAnalyticsInsightGridEntity;
}

export const WebAnalyticsInsightSchema = SchemaFactory.createForClass(WebAnalyticsInsightEntity);

@Schema()
export class WebAnalyticsViewEntity {
  _id: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ default: false })
  traffic: boolean;
}

export const WebAnalyticsViewSchema = SchemaFactory.createForClass(WebAnalyticsViewEntity);

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

  @Prop({ type: [WebAnalyticsViewSchema], default: [] })
  views?: WebAnalyticsViewEntity[];

  @Prop({ default: 0 })
  viewsVersion?: number;
}

export const WebAnalyticsSiteSchema = SchemaFactory.createForClass(WebAnalyticsSiteEntity);

WebAnalyticsSiteSchema.index({ clusterId: 1 }, { unique: true });
