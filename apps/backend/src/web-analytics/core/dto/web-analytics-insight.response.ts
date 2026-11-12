import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  WEB_ANALYTICS_INSIGHT_BUCKETS,
  WebAnalyticsFunnelLayout,
  WebAnalyticsFunnelMode,
  WebAnalyticsInsightBucket,
  WebAnalyticsInsightEvent,
  WebAnalyticsChartBody,
  WebAnalyticsInsightConfig,
  WebAnalyticsInsightEventBody,
  WebAnalyticsInsightFilter,
  WebAnalyticsInsightFilterBody,
  WebAnalyticsInsightGrid,
  WebAnalyticsInsightGridBody,
  WebAnalyticsInsightMeasure,
  WebAnalyticsInsightType,
} from './web-analytics-insight.body';

export class WebAnalyticsInsightSerialized {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: WebAnalyticsInsightType })
  type: WebAnalyticsInsightType;

  @ApiProperty()
  title: string;

  @ApiProperty()
  days: number;

  @ApiPropertyOptional({ enum: WebAnalyticsFunnelMode })
  mode?: WebAnalyticsFunnelMode;

  @ApiPropertyOptional({ enum: WebAnalyticsFunnelLayout })
  layout?: WebAnalyticsFunnelLayout;

  @ApiPropertyOptional({ type: String, isArray: true })
  steps?: string[];

  @ApiPropertyOptional({ type: WebAnalyticsInsightEventBody, isArray: true })
  events?: WebAnalyticsInsightEvent[];

  @ApiPropertyOptional({ type: WebAnalyticsInsightFilterBody, isArray: true })
  filters?: WebAnalyticsInsightFilter[];

  @ApiPropertyOptional({ enum: WEB_ANALYTICS_INSIGHT_BUCKETS })
  bucket?: WebAnalyticsInsightBucket;

  @ApiPropertyOptional({
    enum: WebAnalyticsInsightMeasure,
    description: 'Trends only. Absent means events',
  })
  measure?: WebAnalyticsInsightMeasure;

  @ApiPropertyOptional()
  property?: string;

  @ApiPropertyOptional()
  binSize?: number;

  @ApiPropertyOptional({
    type: () => WebAnalyticsChartBody,
    isArray: true,
    description: 'Tabs cards only: the chart configs, each title is the tab label',
  })
  tabs?: WebAnalyticsInsightConfig[];

  @ApiPropertyOptional({ description: 'The view id. Absent means the first view' })
  view?: string;

  @ApiPropertyOptional({ description: 'Absent means shown' })
  hidden?: boolean;

  @ApiPropertyOptional({
    type: WebAnalyticsInsightGridBody,
    description:
      'Where the card sits on the 12 column grid. Absent means the dashboard places it at the end with the default size of its type',
  })
  grid?: WebAnalyticsInsightGrid;
}

export class WebAnalyticsViewSerialized {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ description: 'Whether the built-in traffic cards show in this view' })
  traffic: boolean;
}

export class WebAnalyticsInsightsResponse {
  @ApiProperty({
    description:
      'Grows each time the views change. Pass it to PUT /views as version to get 409 instead of overwriting a newer change',
  })
  viewsVersion: number;

  @ApiProperty({
    type: WebAnalyticsViewSerialized,
    isArray: true,
    description: 'The dashboard views in order, the first one is the default',
  })
  views: WebAnalyticsViewSerialized[];

  @ApiProperty({ type: WebAnalyticsInsightSerialized, isArray: true })
  insights: WebAnalyticsInsightSerialized[];
}

export class WebAnalyticsInsightStep {
  @ApiProperty({ description: 'The event name, or page:<path> or goal:<event> of a people funnel' })
  name: string;

  @ApiProperty({ description: 'Events, or people for a people funnel' })
  count: number;
}

export class WebAnalyticsInsightSeries {
  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ description: 'The label of the line, when it has one' })
  label?: string;

  @ApiProperty({
    enum: WEB_ANALYTICS_INSIGHT_BUCKETS,
    description: 'The bucket the line counts per',
  })
  bucket: WebAnalyticsInsightBucket;

  @ApiProperty({
    type: Number,
    isArray: true,
    description:
      'Events, or distinct people, per bucket, in times order. A line with a coarser bucket than times repeats its count on each time of its bucket',
  })
  counts: number[];

  @ApiProperty({
    description:
      'Events of the whole period, the sum of the buckets of the line. For people it is the distinct people of the whole period, so it is below the sum of the buckets',
  })
  total: number;
}

export class WebAnalyticsInsightBin {
  @ApiProperty({ description: 'The lowest value of the bar' })
  value: number;

  @ApiProperty()
  count: number;

  @ApiProperty({ description: 'Percent of all events in the distribution' })
  share: number;
}

export class WebAnalyticsInsightDistributionSummary {
  @ApiProperty()
  count: number;

  @ApiProperty({ type: Number, nullable: true })
  mean: number | null;

  @ApiProperty({ type: Number, nullable: true })
  median: number | null;
}

export class WebAnalyticsInsightCohort {
  @ApiProperty({ example: '2026-11-02', description: 'The first day of the cohort row' })
  cohort: string;

  @ApiProperty({ type: Number, isArray: true, description: 'Events of each insight event' })
  counts: number[];

  @ApiProperty({
    type: Number,
    isArray: true,
    nullable: true,
    description: 'Each count as a percent of the start event, null without start events',
  })
  shares: (number | null)[];

  @ApiProperty({
    type: Boolean,
    isArray: true,
    description: 'Whether each count can still grow: the cohort is younger than lagDays',
  })
  filling: boolean[];
}

export class WebAnalyticsInsightResult {
  @ApiProperty({ enum: WebAnalyticsInsightType })
  type: WebAnalyticsInsightType;

  @ApiProperty()
  from: string;

  @ApiProperty()
  to: string;

  @ApiPropertyOptional({ type: WebAnalyticsInsightStep, isArray: true })
  steps?: WebAnalyticsInsightStep[];

  @ApiPropertyOptional({ type: Number, isArray: true, description: 'Bucket starts in ms' })
  times?: number[];

  @ApiPropertyOptional({
    enum: WEB_ANALYTICS_INSIGHT_BUCKETS,
    description:
      'Trends: the bucket each of times starts. It is day when the lines count per different buckets',
  })
  bucket?: WebAnalyticsInsightBucket;

  @ApiPropertyOptional({
    enum: WebAnalyticsInsightMeasure,
    description: 'Trends: whether the counts of the series are events or distinct people',
  })
  measure?: WebAnalyticsInsightMeasure;

  @ApiPropertyOptional({ type: WebAnalyticsInsightSeries, isArray: true })
  series?: WebAnalyticsInsightSeries[];

  @ApiPropertyOptional({ type: WebAnalyticsInsightBin, isArray: true })
  bins?: WebAnalyticsInsightBin[];

  @ApiPropertyOptional({ type: WebAnalyticsInsightDistributionSummary })
  summary?: WebAnalyticsInsightDistributionSummary;

  @ApiPropertyOptional({ type: WebAnalyticsInsightCohort, isArray: true })
  cohorts?: WebAnalyticsInsightCohort[];

  @ApiPropertyOptional({
    type: Number,
    isArray: true,
    description: 'Days from the cohort date that hold 95% of each insight event',
  })
  lagDays?: number[];
}

export class WebAnalyticsSchemaEvent {
  @ApiProperty()
  name: string;

  @ApiProperty()
  count: number;

  @ApiProperty({ type: String, isArray: true })
  properties: string[];
}

export class WebAnalyticsSchemaResponse {
  @ApiProperty()
  from: string;

  @ApiProperty()
  to: string;

  @ApiProperty({ type: WebAnalyticsSchemaEvent, isArray: true })
  events: WebAnalyticsSchemaEvent[];
}
