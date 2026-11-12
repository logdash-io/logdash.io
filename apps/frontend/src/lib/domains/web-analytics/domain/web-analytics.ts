export interface WebAnalyticsSite {
  id: string;
  clusterId: string;
  origins: string[];
  goals: string[];
}

export interface WebAnalyticsStatus {
  lastWebEventAt: string | null;
  lastLogAt: string | null;
}

export type WebAnalyticsGranularity = 'hour' | 'day' | 'week' | 'month';

export type WebAnalyticsFilterDimension =
  | 'channel'
  | 'source'
  | 'referrer'
  | 'campaign'
  | 'content'
  | 'keyword'
  | 'hostname'
  | 'page'
  | 'country'
  | 'browser'
  | 'os'
  | 'device'
  | 'goal'
  | 'app';

export type WebAnalyticsFilterKey =
  | WebAnalyticsFilterDimension
  | `prop.${string}`;

export interface WebAnalyticsFilter {
  dimension: WebAnalyticsFilterKey;
  value: string;
}

export type WebAnalyticsBreakdownName =
  | 'channels'
  | 'sources'
  | 'referrers'
  | 'campaigns'
  | 'contents'
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
  people: number;
  pageviews: number;
  sessions: number;
  bounceRate: number;
  sessionSeconds: number;
  conversionRate: number;
}

export interface WebAnalyticsPoint {
  time: number;
  visitors: number;
  people: number;
  pageviews: number;
}

export interface WebAnalyticsAppRow {
  name: string;
  website: boolean;
  visitors: number;
  people: number;
  count: number;
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
  apps: WebAnalyticsAppRow[];
}

export interface WebAnalyticsEventSummary {
  count: number;
  visitors: number;
  people: number;
  conversionRate: number;
}

export interface WebAnalyticsEventPoint {
  time: number;
  count: number;
  visitors: number;
  people: number;
}

export interface WebAnalyticsEvent {
  from: string;
  to: string;
  granularity: WebAnalyticsGranularity;
  summary: WebAnalyticsEventSummary;
  previous: WebAnalyticsEventSummary;
  series: WebAnalyticsEventPoint[];
  previousSeries?: WebAnalyticsEventPoint[];
  properties: WebAnalyticsBreakdownRow[];
}

export interface WebAnalyticsOverview {
  visitors: number;
  series: WebAnalyticsPoint[];
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
  apps: string[];
  identified: boolean;
}

export interface WebAnalyticsVisitorEvent {
  time: string;
  name: string;
  path: string;
  hostname: string;
  app: string;
  sessionId: string;
  source: string;
}

export interface WebAnalyticsJourney {
  steps: string[];
  sessions: number;
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

export type WebAnalyticsChartType =
  | 'funnel'
  | 'trend'
  | 'distribution'
  | 'cohorts';

export type WebAnalyticsInsightType = WebAnalyticsChartType | 'tabs';

export type WebAnalyticsFunnelMode = 'people' | 'events';

export type WebAnalyticsFunnelLayout = 'columns' | 'rows';

export type WebAnalyticsInsightOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte';

export type WebAnalyticsInsightBucket = 'day' | 'week' | 'month';

/** What a trend line counts: its events, or the distinct people who sent them. */
export type WebAnalyticsInsightMeasure = 'events' | 'people';

export interface WebAnalyticsInsightFilter {
  key: string;
  op: WebAnalyticsInsightOperator;
  value: string;
}

export interface WebAnalyticsInsightEvent {
  name: string;
  filters: WebAnalyticsInsightFilter[];
  label?: string;
  bucket?: WebAnalyticsInsightBucket;
}

export interface WebAnalyticsChartConfig {
  type: WebAnalyticsChartType;
  title: string;
  days: number;
  mode?: WebAnalyticsFunnelMode;
  layout?: WebAnalyticsFunnelLayout;
  steps?: string[];
  events?: WebAnalyticsInsightEvent[];
  filters?: WebAnalyticsInsightFilter[];
  bucket?: WebAnalyticsInsightBucket;
  measure?: WebAnalyticsInsightMeasure;
  property?: string;
  binSize?: number;
}

export interface WebAnalyticsInsightGrid {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WebAnalyticsInsightPlacement {
  view?: string | null;
  hidden?: boolean | null;
  grid?: WebAnalyticsInsightGrid | null;
}

export interface WebAnalyticsInsightPlacementUpdate
  extends WebAnalyticsInsightPlacement {
  id: string;
}

export interface WebAnalyticsInsightConfig
  extends Omit<WebAnalyticsChartConfig, 'type'>,
    WebAnalyticsInsightPlacement {
  type: WebAnalyticsInsightType;
  tabs?: WebAnalyticsChartConfig[];
}

export interface WebAnalyticsInsight extends WebAnalyticsInsightConfig {
  id: string;
}

export interface WebAnalyticsView {
  id: string;
  name: string;
  traffic: boolean;
}

export interface WebAnalyticsViewInput {
  id?: string;
  name: string;
  traffic: boolean;
}

export interface WebAnalyticsInsights {
  viewsVersion?: number;
  views: WebAnalyticsView[];
  insights: WebAnalyticsInsight[];
}

export interface WebAnalyticsInsightStep {
  name: string;
  count: number;
}

export interface WebAnalyticsInsightSeries {
  name: string;
  label?: string;
  bucket?: WebAnalyticsInsightBucket;
  counts: number[];
  total?: number;
}

export interface WebAnalyticsInsightBin {
  value: number;
  count: number;
  share: number;
}

export interface WebAnalyticsInsightCohort {
  cohort: string;
  counts: number[];
  shares: (number | null)[];
  filling: boolean[];
}

export interface WebAnalyticsInsightResult {
  type: WebAnalyticsChartType;
  from: string;
  to: string;
  steps?: WebAnalyticsInsightStep[];
  times?: number[];
  bucket?: WebAnalyticsInsightBucket;
  measure?: WebAnalyticsInsightMeasure;
  series?: WebAnalyticsInsightSeries[];
  bins?: WebAnalyticsInsightBin[];
  summary?: { count: number; mean: number | null; median: number | null };
  cohorts?: WebAnalyticsInsightCohort[];
  lagDays?: number[];
}

export interface WebAnalyticsSchemaEvent {
  name: string;
  count: number;
  properties: string[];
}

export interface WebAnalyticsSchema {
  from: string;
  to: string;
  events: WebAnalyticsSchemaEvent[];
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
  /** Set when the line counts per a bucket coarser than the ticks: it steps at each bucket start. */
  bucket?: WebAnalyticsInsightBucket;
}

export interface WebAnalyticsDayCounts {
  date: string;
  visits: number;
  stayed: number;
  goals: number[];
}

export interface WebAnalyticsSourceSeries {
  name: string;
  visits: number[];
}

export interface WebAnalyticsDays {
  today: string;
  elapsed: number;
  since: string | null;
  from: string;
  to: string;
  days: WebAnalyticsDayCounts[];
  todayTypical: WebAnalyticsDayCounts[];
  sources: WebAnalyticsSourceSeries[];
  online: number;
}

export interface WebAnalyticsDayGroupCounts {
  visits: number;
  stayed: number;
  medianSeconds: number;
}

export interface WebAnalyticsDayGroup {
  name: string;
  days: WebAnalyticsDayGroupCounts[];
}

export interface WebAnalyticsDay {
  date: string;
  dates: string[];
  cutoff: number | null;
  hours: number[][];
  goalHours: number[][];
  sourceHours: WebAnalyticsSourceSeries[];
  sources: WebAnalyticsDayGroup[];
  pages: WebAnalyticsDayGroup[];
}

export type WebAnalyticsVisitShow = 'all' | 'stayed' | 'goal';

export interface WebAnalyticsDayVisit {
  id: string;
  identified: boolean;
  startedAt: string;
  lastSeenAt: string;
  source: string;
  entryPage: string;
  exitPage: string;
  pageviews: number;
  sessions: number;
  seconds: number;
  stayed: boolean;
  goals: (string | null)[];
  country: string;
  device: string;
  browser: string;
  os: string;
}

export interface WebAnalyticsDayVisits {
  visits: WebAnalyticsDayVisit[];
  total: number;
}

export interface WebAnalyticsGoalOption {
  name: string;
  visits: number;
}

export interface WebAnalyticsGoals {
  goals: WebAnalyticsGoalOption[];
  picked: string[];
}

export interface WebAnalyticsDayParams {
  tz: string;
  goals: string[];
  filters: WebAnalyticsFilter[];
}
