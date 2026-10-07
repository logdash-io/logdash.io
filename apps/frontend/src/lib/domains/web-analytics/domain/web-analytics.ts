export interface WebAnalyticsSite {
  id: string;
  clusterId: string;
  origins: string[];
}

export interface WebAnalyticsStatus {
  lastWebEventAt: string | null;
  lastLogAt: string | null;
}

export type WebAnalyticsGranularity = 'hour' | 'day' | 'week' | 'month';

export type WebAnalyticsFilterDimension =
  | 'channel'
  | 'referrer'
  | 'campaign'
  | 'keyword'
  | 'hostname'
  | 'page'
  | 'country'
  | 'browser'
  | 'os'
  | 'device'
  | 'goal';

export interface WebAnalyticsFilter {
  dimension: WebAnalyticsFilterDimension;
  value: string;
}

export type WebAnalyticsBreakdownName =
  | 'channels'
  | 'referrers'
  | 'campaigns'
  | 'keywords'
  | 'hostnames'
  | 'pages'
  | 'entryPages'
  | 'exitPages'
  | 'countries'
  | 'browsers'
  | 'os'
  | 'devices'
  | 'goals';

export interface WebAnalyticsBreakdownRow {
  name: string;
  visitors: number;
  count: number;
}

export interface WebAnalyticsSummary {
  visitors: number;
  pageviews: number;
  sessions: number;
  bounceRate: number;
  sessionSeconds: number;
  conversionRate: number;
}

export interface WebAnalyticsPoint {
  time: number;
  visitors: number;
  pageviews: number;
}

export interface WebAnalyticsReport {
  from: string;
  to: string;
  granularity: WebAnalyticsGranularity;
  retentionDays: number;
  summary: WebAnalyticsSummary;
  previous: WebAnalyticsSummary;
  series: WebAnalyticsPoint[];
  previousSeries?: WebAnalyticsPoint[];
  goalSeries: { name: string; counts: number[] }[];
  online: number;
  breakdowns: Record<WebAnalyticsBreakdownName, WebAnalyticsBreakdownRow[]>;
}

export interface WebAnalyticsOverview {
  visitors: number;
  series: WebAnalyticsPoint[];
  online: number;
}

export interface WebAnalyticsVisitor {
  id: string;
  firstSeen: string;
  lastSeen: string;
  country: string;
  device: string;
  os: string;
  browser: string;
  source: string;
  sessions: number;
  pageviews: number;
  activeDays: string[];
  identified: boolean;
}

export interface WebAnalyticsVisitorEvent {
  time: string;
  name: string;
  path: string;
  hostname: string;
  sessionId: string;
  source: string;
}

export interface WebAnalyticsJourney {
  steps: string[];
  sessions: number;
}

export interface WebAnalyticsFunnelStep {
  step: string;
  visitors: number;
}

export interface WebAnalyticsCohort {
  date: string;
  users: number;
  day1: number | null;
  day7: number | null;
  day30: number | null;
  day90: number | null;
}

export interface WebAnalyticsStickiness {
  dailyActive: number;
  monthlyActive: number;
  ratio: number | null;
}

export interface WebAnalyticsComeback {
  minDays: 30 | 60 | 90;
  users: number;
}

export interface WebAnalyticsRetention {
  cohorts: WebAnalyticsCohort[];
  stickiness: WebAnalyticsStickiness;
  comebacks: WebAnalyticsComeback[];
}

export interface WebAnalyticsRange {
  from: Date;
  to: Date;
  granularity: WebAnalyticsGranularity;
  tz: string;
  filters: WebAnalyticsFilter[];
  compare: boolean;
}

export interface AnalyticsChartLine {
  label: string;
  values: number[];
  color: string;
  area?: boolean;
  dashed?: boolean;
}
