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
  @ApiProperty({
    description:
      'Visits: each visitor counts once per day in the requested time zone, because anonymous visitor IDs change every day',
  })
  visitors: number;

  @ApiProperty({ description: 'Identified people, each counted once in the range' })
  people: number;

  @ApiProperty()
  pageviews: number;

  @ApiProperty()
  sessions: number;

  @ApiProperty({ description: 'Share of sessions with at most one pageview, 0 to 100' })
  bounceRate: number;

  @ApiProperty({ description: 'Average time between the first and last event of a session' })
  sessionSeconds: number;

  @ApiProperty({ description: 'Share of visits with any goal, 0 to 100' })
  conversionRate: number;
}

export class WebAnalyticsPoint {
  @ApiProperty({ description: 'Bucket start, Unix milliseconds' })
  time: number;

  @ApiProperty({ description: 'Visits, each visitor once per day' })
  visitors: number;

  @ApiProperty({ description: 'Identified people' })
  people: number;

  @ApiProperty()
  pageviews: number;
}

export class WebAnalyticsAppRow {
  @ApiProperty({ description: 'App name, or the hostname for website events' })
  name: string;

  @ApiProperty({ description: 'Whether these are website events, named by hostname' })
  website: boolean;

  @ApiProperty({ description: 'Visits, each visitor once per day' })
  visitors: number;

  @ApiProperty({ description: 'Identified people' })
  people: number;

  @ApiProperty({ description: 'Events, without page leaves' })
  count: number;
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

  @ApiProperty({ type: WebAnalyticsAppRow, isArray: true })
  apps: WebAnalyticsAppRow[];
}

export class WebAnalyticsOverviewResponse {
  @ApiProperty()
  visitors: number;

  @ApiProperty({ type: WebAnalyticsPoint, isArray: true })
  series: WebAnalyticsPoint[];
}

export class WebAnalyticsBreakdownResponse {
  @ApiProperty({ type: WebAnalyticsBreakdownRow, isArray: true })
  rows: WebAnalyticsBreakdownRow[];
}

export class WebAnalyticsEventSummary {
  @ApiProperty({ description: 'Times the event was sent' })
  count: number;

  @ApiProperty({ description: 'Visits with the event, each visitor once per day' })
  visitors: number;

  @ApiProperty({ description: 'Identified people who sent the event' })
  people: number;

  @ApiProperty({ description: 'Share of visits with the event, 0 to 100' })
  conversionRate: number;
}

export class WebAnalyticsEventPoint {
  @ApiProperty({ description: 'Bucket start, Unix milliseconds' })
  time: number;

  @ApiProperty()
  count: number;

  @ApiProperty({ description: 'Visits with the event' })
  visitors: number;

  @ApiProperty({ description: 'Identified people who sent the event' })
  people: number;
}

export class WebAnalyticsEventResponse {
  @ApiProperty()
  from: string;

  @ApiProperty()
  to: string;

  @ApiProperty({ enum: WebAnalyticsGranularity })
  granularity: WebAnalyticsGranularity;

  @ApiProperty({ type: WebAnalyticsEventSummary })
  summary: WebAnalyticsEventSummary;

  @ApiProperty({ type: WebAnalyticsEventSummary })
  previous: WebAnalyticsEventSummary;

  @ApiProperty({ type: WebAnalyticsEventPoint, isArray: true })
  series: WebAnalyticsEventPoint[];

  @ApiPropertyOptional({ type: WebAnalyticsEventPoint, isArray: true })
  previousSeries?: WebAnalyticsEventPoint[];

  @ApiProperty({
    type: WebAnalyticsBreakdownRow,
    isArray: true,
    description: 'Property keys sent with the event, most used first',
  })
  properties: WebAnalyticsBreakdownRow[];
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

  @ApiProperty({ description: 'First website source, empty for visitors seen only in apps' })
  source: string;

  @ApiProperty()
  sessions: number;

  @ApiProperty()
  pageviews: number;

  @ApiProperty({ type: String, isArray: true, description: 'Active days, YYYY-MM-DD' })
  activeDays: string[];

  @ApiProperty({ type: String, isArray: true, description: 'Apps that tracked events for them' })
  apps: string[];
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

  @ApiProperty({ description: 'The app that tracked the event, empty for website events' })
  app: string;

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

export class WebAnalyticsSourceSeries {
  @ApiProperty({ example: 'news.ycombinator.com' })
  name: string;

  @ApiProperty({ type: Number, isArray: true })
  visits: number[];
}

export class WebAnalyticsDayCounts {
  @ApiProperty({ example: '2026-10-25' })
  date: string;

  @ApiProperty({ description: 'Visits: one visitor on one day' })
  visits: number;

  @ApiProperty({
    description: 'Visits with 2 or more pageviews, a custom event, or 10 seconds or more',
  })
  stayed: number;

  @ApiProperty({
    type: Number,
    isArray: true,
    description:
      'People who sent each requested goal that day, on the website or in an app, in the order of the goal parameter. Each goal is counted on its own, so a goal can have more people than the one before it',
  })
  goals: number[];
}

export class WebAnalyticsDaysResponse {
  @ApiProperty({ example: '2026-10-25', description: 'Today in the requested time zone' })
  today: string;

  @ApiProperty({ description: 'Seconds after midnight that today has reached' })
  elapsed: number;

  @ApiProperty({
    nullable: true,
    example: '2026-07-28',
    description: 'The first day with visits within the plan retention, or null without visits',
  })
  since: string | null;

  @ApiProperty({ example: '2026-09-28', description: 'The first of the 28 days' })
  from: string;

  @ApiProperty({ example: '2026-10-25', description: 'The last of the 28 days' })
  to: string;

  @ApiProperty({
    type: WebAnalyticsDayCounts,
    isArray: true,
    description: 'Every day from 28 days before from up to to, oldest first',
  })
  days: WebAnalyticsDayCounts[];

  @ApiProperty({
    type: WebAnalyticsDayCounts,
    isArray: true,
    description:
      "Today's weekday in each of the 4 weeks before, counted up to the time of day today has reached. Empty unless to is today",
  })
  todayTypical: WebAnalyticsDayCounts[];

  @ApiProperty({
    type: WebAnalyticsSourceSeries,
    isArray: true,
    description:
      'Visits per day from each of the top sources of the 28 days, one per day from from to to',
  })
  sources: WebAnalyticsSourceSeries[];

  @ApiProperty({ description: 'Visitors in the last 5 minutes' })
  online: number;
}

export class WebAnalyticsDayGroupCounts {
  @ApiProperty()
  visits: number;

  @ApiProperty()
  stayed: number;

  @ApiProperty({ description: 'Median time a visit lasted, from its first event to its last' })
  medianSeconds: number;
}

export class WebAnalyticsDayGroup {
  @ApiProperty({ example: 'news.ycombinator.com' })
  name: string;

  @ApiProperty({
    type: WebAnalyticsDayGroupCounts,
    isArray: true,
    description: 'One entry per date of the response',
  })
  days: WebAnalyticsDayGroupCounts[];
}

export class WebAnalyticsDayResponse {
  @ApiProperty({ example: '2026-10-25' })
  date: string;

  @ApiProperty({
    type: String,
    isArray: true,
    description: 'The day, then the same weekday in each of the 4 weeks before it',
  })
  dates: string[];

  @ApiProperty({
    nullable: true,
    description:
      'For today, the seconds after midnight that the earlier days are counted up to in sources and pages',
  })
  cutoff: number | null;

  @ApiProperty({
    type: 'array',
    items: { type: 'array', items: { type: 'number' } },
    description: 'Visits that started in each hour, one list of 24 per date',
  })
  hours: number[][];

  @ApiProperty({
    type: 'array',
    items: { type: 'array', items: { type: 'number' } },
    description:
      'People who first sent each requested goal that day in each hour, on the website or in an app, 24 per goal',
  })
  goalHours: number[][];

  @ApiProperty({
    type: WebAnalyticsSourceSeries,
    isArray: true,
    description: 'Visits that started in each hour of the day, for each of its top sources',
  })
  sourceHours: WebAnalyticsSourceSeries[];

  @ApiProperty({ type: WebAnalyticsDayGroup, isArray: true })
  sources: WebAnalyticsDayGroup[];

  @ApiProperty({ type: WebAnalyticsDayGroup, isArray: true, description: 'Landing pages' })
  pages: WebAnalyticsDayGroup[];
}

export class WebAnalyticsDayVisit {
  @ApiProperty({
    description: 'Profile id: the hashed user id when identified, otherwise the daily visitor hash',
  })
  id: string;

  @ApiProperty()
  identified: boolean;

  @ApiProperty()
  startedAt: string;

  @ApiProperty()
  lastSeenAt: string;

  @ApiProperty({ example: 'news.ycombinator.com' })
  source: string;

  @ApiProperty()
  entryPage: string;

  @ApiProperty()
  exitPage: string;

  @ApiProperty()
  pageviews: number;

  @ApiProperty({ description: 'Sessions the visit is made of' })
  sessions: number;

  @ApiProperty()
  seconds: number;

  @ApiProperty()
  stayed: boolean;

  @ApiProperty({
    type: String,
    isArray: true,
    nullable: true,
    description:
      'When the visit first sent each requested goal on the website, or null. Goals sent from an app are counted per day, not per visit',
  })
  goals: (string | null)[];

  @ApiProperty()
  country: string;

  @ApiProperty()
  device: string;

  @ApiProperty()
  browser: string;

  @ApiProperty()
  os: string;
}

export class WebAnalyticsDayVisitsResponse {
  @ApiProperty({ type: WebAnalyticsDayVisit, isArray: true })
  visits: WebAnalyticsDayVisit[];

  @ApiProperty()
  total: number;
}

export class WebAnalyticsGoalOption {
  @ApiProperty({ example: 'signup' })
  name: string;

  @ApiProperty({
    description:
      'People who sent it each day, on the website or in an app, added up over the last 28 days',
  })
  visits: number;
}

export class WebAnalyticsGoalsResponse {
  @ApiProperty({ type: WebAnalyticsGoalOption, isArray: true })
  goals: WebAnalyticsGoalOption[];

  @ApiProperty({
    type: String,
    isArray: true,
    description: 'The goals the domain reports on: the saved ones, or else its 2 most reached',
  })
  picked: string[];
}
