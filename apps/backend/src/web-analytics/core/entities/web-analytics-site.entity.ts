import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import {
  WebAnalyticsFunnelLayout,
  WebAnalyticsFunnelMode,
  WebAnalyticsInsightBucket,
  WebAnalyticsInsightConfig,
  WebAnalyticsInsightEvent,
  WebAnalyticsInsightFilter,
  WebAnalyticsInsightType,
  WebAnalyticsInsightWidth,
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

  @Prop({ type: [Object], default: undefined })
  tabs?: WebAnalyticsInsightConfig[];

  @Prop()
  view?: string;

  @Prop()
  section?: string;

  @Prop()
  hidden?: boolean;

  @Prop()
  width?: WebAnalyticsInsightWidth;
}

export const WebAnalyticsInsightSchema = SchemaFactory.createForClass(WebAnalyticsInsightEntity);

@Schema()
export class WebAnalyticsSectionEntity {
  _id: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ default: false })
  collapsed: boolean;
}

export const WebAnalyticsSectionSchema = SchemaFactory.createForClass(WebAnalyticsSectionEntity);

@Schema()
export class WebAnalyticsViewEntity {
  _id: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ default: false })
  traffic: boolean;

  @Prop({ type: [WebAnalyticsSectionSchema], default: [] })
  sections: WebAnalyticsSectionEntity[];
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
}

export const WebAnalyticsSiteSchema = SchemaFactory.createForClass(WebAnalyticsSiteEntity);

WebAnalyticsSiteSchema.index({ clusterId: 1 }, { unique: true });
