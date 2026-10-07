import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WebAnalyticsGranularity } from './read-web-analytics.query';

export class WebAnalyticsBreakdownRow {
  @ApiProperty()
  name: string;

  @ApiProperty()
  visitors: number;

  @ApiProperty()
  count: number;
}

export class WebAnalyticsBreakdowns {
  @ApiProperty({ type: WebAnalyticsBreakdownRow, isArray: true })
  channels: WebAnalyticsBreakdownRow[];

  @ApiProperty({ type: WebAnalyticsBreakdownRow, isArray: true })
  referrers: WebAnalyticsBreakdownRow[];

  @ApiProperty({ type: WebAnalyticsBreakdownRow, isArray: true })
  campaigns: WebAnalyticsBreakdownRow[];

  @ApiProperty({ type: WebAnalyticsBreakdownRow, isArray: true })
  keywords: WebAnalyticsBreakdownRow[];

  @ApiProperty({ type: WebAnalyticsBreakdownRow, isArray: true })
  hostnames: WebAnalyticsBreakdownRow[];

  @ApiProperty({ type: WebAnalyticsBreakdownRow, isArray: true })
  pages: WebAnalyticsBreakdownRow[];

  @ApiProperty({ type: WebAnalyticsBreakdownRow, isArray: true })
  entryPages: WebAnalyticsBreakdownRow[];

  @ApiProperty({ type: WebAnalyticsBreakdownRow, isArray: true })
  exitPages: WebAnalyticsBreakdownRow[];

  @ApiProperty({ type: WebAnalyticsBreakdownRow, isArray: true })
  countries: WebAnalyticsBreakdownRow[];

  @ApiProperty({ type: WebAnalyticsBreakdownRow, isArray: true })
  browsers: WebAnalyticsBreakdownRow[];

  @ApiProperty({ type: WebAnalyticsBreakdownRow, isArray: true })
  os: WebAnalyticsBreakdownRow[];

  @ApiProperty({ type: WebAnalyticsBreakdownRow, isArray: true })
  devices: WebAnalyticsBreakdownRow[];

  @ApiProperty({ type: WebAnalyticsBreakdownRow, isArray: true })
  goals: WebAnalyticsBreakdownRow[];
}

export class WebAnalyticsSummary {
  @ApiProperty()
  visitors: number;

  @ApiProperty()
  pageviews: number;

  @ApiProperty()
  sessions: number;

  @ApiProperty({ description: 'Share of sessions with at most one pageview, 0 to 100' })
  bounceRate: number;

  @ApiProperty({ description: 'Average time between the first and last event of a session' })
  sessionSeconds: number;

  @ApiProperty({ description: 'Share of visitors who completed any goal, 0 to 100' })
  conversionRate: number;
}

export class WebAnalyticsPoint {
  @ApiProperty({ description: 'Bucket start, Unix milliseconds' })
  time: number;

  @ApiProperty()
  visitors: number;

  @ApiProperty()
  pageviews: number;
}

export class WebAnalyticsGoalSeries {
  @ApiProperty()
  name: string;

  @ApiProperty({ type: Number, isArray: true })
  counts: number[];
}

export class WebAnalyticsResponse {
  @ApiProperty()
  from: string;

  @ApiProperty()
  to: string;

  @ApiProperty({ enum: WebAnalyticsGranularity })
  granularity: WebAnalyticsGranularity;

  @ApiProperty()
  retentionDays: number;

  @ApiProperty({ type: WebAnalyticsSummary })
  summary: WebAnalyticsSummary;

  @ApiProperty({ type: WebAnalyticsSummary })
  previous: WebAnalyticsSummary;

  @ApiProperty({ type: WebAnalyticsPoint, isArray: true })
  series: WebAnalyticsPoint[];

  @ApiPropertyOptional({ type: WebAnalyticsPoint, isArray: true })
  previousSeries?: WebAnalyticsPoint[];

  @ApiProperty({ type: WebAnalyticsGoalSeries, isArray: true })
  goalSeries: WebAnalyticsGoalSeries[];

  @ApiProperty({ description: 'Visitors with an event in the last five minutes' })
  online: number;

  @ApiProperty({ type: WebAnalyticsBreakdowns })
  breakdowns: WebAnalyticsBreakdowns;
}

export class WebAnalyticsOverviewResponse {
  @ApiProperty()
  visitors: number;

  @ApiProperty({ type: WebAnalyticsPoint, isArray: true })
  series: WebAnalyticsPoint[];

  @ApiProperty({ description: 'Visitors with an event in the last five minutes' })
  online: number;
}

export class WebAnalyticsBreakdownResponse {
  @ApiProperty({ type: WebAnalyticsBreakdownRow, isArray: true })
  rows: WebAnalyticsBreakdownRow[];
}

export class WebAnalyticsVisitor {
  @ApiProperty({ description: 'Hashed user id when identified, otherwise the daily visitor hash' })
  id: string;

  @ApiProperty({ description: 'Whether the site identified this person with logdash.identify' })
  identified: boolean;

  @ApiProperty()
  firstSeen: string;

  @ApiProperty()
  lastSeen: string;

  @ApiProperty()
  country: string;

  @ApiProperty()
  device: string;

  @ApiProperty()
  os: string;

  @ApiProperty()
  browser: string;

  @ApiProperty()
  source: string;

  @ApiProperty()
  sessions: number;

  @ApiProperty()
  pageviews: number;

  @ApiProperty({ type: String, isArray: true, description: 'Active days, YYYY-MM-DD' })
  activeDays: string[];
}

export class WebAnalyticsVisitorsResponse {
  @ApiProperty({ type: WebAnalyticsVisitor, isArray: true })
  visitors: WebAnalyticsVisitor[];

  @ApiProperty()
  total: number;
}

export class WebAnalyticsVisitorEvent {
  @ApiProperty()
  time: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  path: string;

  @ApiProperty()
  hostname: string;

  @ApiProperty()
  sessionId: string;

  @ApiProperty()
  source: string;
}

export class WebAnalyticsVisitorResponse {
  @ApiProperty({ type: WebAnalyticsVisitor, nullable: true })
  visitor: WebAnalyticsVisitor | null;

  @ApiProperty({ type: WebAnalyticsVisitorEvent, isArray: true })
  events: WebAnalyticsVisitorEvent[];
}

export class WebAnalyticsJourney {
  @ApiProperty({ type: String, isArray: true })
  steps: string[];

  @ApiProperty()
  sessions: number;
}

export class WebAnalyticsJourneysResponse {
  @ApiProperty({ type: WebAnalyticsJourney, isArray: true })
  journeys: WebAnalyticsJourney[];
}

export class WebAnalyticsFunnelStep {
  @ApiProperty()
  step: string;

  @ApiProperty()
  visitors: number;
}

export class WebAnalyticsFunnelResponse {
  @ApiProperty({ type: WebAnalyticsFunnelStep, isArray: true })
  steps: WebAnalyticsFunnelStep[];
}

export class WebAnalyticsCohort {
  @ApiProperty({ description: 'Day the identified users were first seen, YYYY-MM-DD' })
  date: string;

  @ApiProperty()
  users: number;

  @ApiProperty({ type: Number, nullable: true, description: 'Share active on day 1, 0 to 100' })
  day1: number | null;

  @ApiProperty({ type: Number, nullable: true })
  day7: number | null;

  @ApiProperty({ type: Number, nullable: true })
  day30: number | null;

  @ApiProperty({ type: Number, nullable: true })
  day90: number | null;
}

export class WebAnalyticsStickiness {
  @ApiProperty({ description: 'Average identified users active per day in the range' })
  dailyActive: number;

  @ApiProperty({ description: 'Identified users active in the 30 days ending at the range end' })
  monthlyActive: number;

  @ApiProperty({ type: Number, nullable: true, description: 'dailyActive / monthlyActive * 100' })
  ratio: number | null;
}

export class WebAnalyticsComeback {
  @ApiProperty({ enum: [30, 60, 90] })
  minDays: 30 | 60 | 90;

  @ApiProperty({ description: 'Identified users back after at least minDays without activity' })
  users: number;
}

export class WebAnalyticsRetentionResponse {
  @ApiProperty({ type: WebAnalyticsCohort, isArray: true })
  cohorts: WebAnalyticsCohort[];

  @ApiProperty({ type: WebAnalyticsStickiness })
  stickiness: WebAnalyticsStickiness;

  @ApiProperty({ type: WebAnalyticsComeback, isArray: true })
  comebacks: WebAnalyticsComeback[];
}

export class WebAnalyticsStatusResponse {
  @ApiProperty({ type: String, nullable: true })
  lastWebEventAt: string | null;

  @ApiProperty({ type: String, nullable: true })
  lastLogAt: string | null;
}
