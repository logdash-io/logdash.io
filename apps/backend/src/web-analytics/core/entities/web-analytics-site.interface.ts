import { ApiProperty } from '@nestjs/swagger';
import {
  WebAnalyticsInsightConfig,
  WebAnalyticsInsightPlacement,
} from '../dto/web-analytics-insight.body';

export type WebAnalyticsInsightNormalized = Omit<
  WebAnalyticsInsightConfig,
  keyof WebAnalyticsInsightPlacement
> & { id: string } & {
  [K in keyof WebAnalyticsInsightPlacement]?: NonNullable<WebAnalyticsInsightPlacement[K]>;
};

export type WebAnalyticsViewNormalized = {
  id: string;
  name: string;
  traffic: boolean;
  sections: { id: string; title: string; collapsed: boolean }[];
};

export type WebAnalyticsLayoutNormalized = {
  views: WebAnalyticsViewNormalized[];
  insights: WebAnalyticsInsightNormalized[];
};

export class WebAnalyticsSiteNormalized {
  id: string;
  clusterId: string;
  origins: string[];
  goals: string[];
}

export class WebAnalyticsSiteSerialized {
  @ApiProperty()
  id: string;

  @ApiProperty()
  clusterId: string;

  @ApiProperty({ type: String, isArray: true })
  origins: string[];

  @ApiProperty({
    type: String,
    isArray: true,
    description: 'The goals picked for the dashboard: the primary one, then up to 9 more',
  })
  goals: string[];
}

export class WebAnalyticsSiteResponse {
  @ApiProperty({ type: WebAnalyticsSiteSerialized, nullable: true })
  site: WebAnalyticsSiteSerialized | null;
}
