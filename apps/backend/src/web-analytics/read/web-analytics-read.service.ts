import { ClickHouseClient } from '@clickhouse/client';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WebAnalyticsSiteEntity } from '../core/entities/web-analytics-site.entity';
import { WebAnalyticsSiteNormalized } from '../core/entities/web-analytics-site.interface';
import { WebAnalyticsSiteSerializer } from '../core/entities/web-analytics-site.serializer';
import {
  WebAnalyticsBreakdownRow,
  WebAnalyticsBreakdowns,
  WebAnalyticsCohort,
  WebAnalyticsEventPoint,
  WebAnalyticsEventResponse,
  WebAnalyticsEventSummary,
  WebAnalyticsFunnelResponse,
  WebAnalyticsJourneysResponse,
  WebAnalyticsOverviewResponse,
  WebAnalyticsPoint,
  WebAnalyticsResponse,
  WebAnalyticsRetentionResponse,
  WebAnalyticsStatusResponse,
  WebAnalyticsSummary,
  WebAnalyticsVisitor,
  WebAnalyticsVisitorResponse,
  WebAnalyticsVisitorsResponse,
} from '../core/dto/web-analytics.response';
import {
  ReadWebAnalyticsFunnelQuery,
  ReadWebAnalyticsQuery,
  WebAnalyticsBreakdownName,
  WebAnalyticsFilterDimension,
  WebAnalyticsGranularity,
} from '../core/dto/read-web-analytics.query';
import { RedisService } from '../../shared/redis/redis.service';
import { ClickhouseUtils } from '../../clickhouse/clickhouse.utils';
import { LogReadService } from '../../log/read/log-read.service';
import { ProjectReadService } from '../../project/read/project-read.service';
import { WEB_ANALYTICS_CHANNEL as CHANNEL } from './web-analytics-channel';

const REFERRER = `if(referrer != '', referrer, 'Direct')`;

const SOURCE = `if(utm_source != '', utm_source, ${REFERRER})`;

const PERSON = `if(user_id != '', user_id, visitor_id)`;

const FILTER_COLUMNS: Record<Exclude<WebAnalyticsFilterDimension, 'page' | 'goal'>, string> = {
  channel: CHANNEL,
  referrer: REFERRER,
  campaign: 'utm_campaign',
  keyword: 'utm_term',
  hostname: 'hostname',
  country: 'country',
  browser: 'browser',
  os: 'os',
  device: 'device',
};

const PAGEVIEW_BREAKDOWNS: Record<
  Exclude<WebAnalyticsBreakdownName, 'entryPages' | 'exitPages' | 'goals'>,
  string
> = {
  channels: CHANNEL,
  referrers: REFERRER,
  campaigns: 'utm_campaign',
  keywords: 'utm_term',
  hostnames: 'hostname',
  pages: 'path',
  countries: 'country',
  browsers: 'browser',
  os: 'os',
  devices: 'device',
};

const NOT_A_GOAL = `('pageview', 'pageleave', 'browser_error')`;

const BUCKETS: Record<WebAnalyticsGranularity, { start: string; add: string; ms: number }> = {
  [WebAnalyticsGranularity.Hour]: { start: 'toStartOfHour', add: 'addHours', ms: 3_600_000 },
  [WebAnalyticsGranularity.Day]: { start: 'toStartOfDay', add: 'addDays', ms: 86_400_000 },
  [WebAnalyticsGranularity.Week]: { start: 'toMonday', add: 'addWeeks', ms: 7 * 86_400_000 },
  [WebAnalyticsGranularity.Month]: {
    start: 'toStartOfMonth',
    add: 'addMonths',
    ms: 28 * 86_400_000,
  },
};

const MAX_BUCKETS = 1000;

const RETENTION_DAYS = [1, 7, 30, 90] as const;

const COMEBACK_DAYS = [30, 60, 90] as const;

type Scope = {
  where: string;
  filter: string;
  params: Record<string, unknown>;
  previousParams: Record<string, unknown>;
  bucket: (column: string) => string;
  addBuckets: string;
  buckets: number;
  from: Date;
  to: Date;
};

type VisitorRow = {
  id: string;
  identified: number;
  first_seen: string;
  last_seen: string;
  last_country: string;
  last_device: string;
  last_os: string;
  last_browser: string;
  source: string;
  sessions: string;
  pageviews: string;
  active_days: string[];
  total?: string;
};

@Injectable()
export class WebAnalyticsReadService {
  constructor(
    @InjectModel(WebAnalyticsSiteEntity.name) private readonly model: Model<WebAnalyticsSiteEntity>,
    private readonly clickhouse: ClickHouseClient,
    private readonly redis: RedisService,
    private readonly logs: LogReadService,
    private readonly projects: ProjectReadService,
  ) {}

  public async readSiteByClusterId(clusterId: string): Promise<WebAnalyticsSiteNormalized | null> {
    const site = await this.model.findOne({ clusterId }).lean<WebAnalyticsSiteEntity>().exec();
    return site ? WebAnalyticsSiteSerializer.normalize(site) : null;
  }

  public async readSiteCached(id: string): Promise<WebAnalyticsSiteNormalized | null> {
    const key = `web-analytics:site:${id}`;
    const cached = await this.redis.get(key);
    if (cached !== null) return JSON.parse(cached) as WebAnalyticsSiteNormalized | null;
    const entity = await this.model.findById(id).lean<WebAnalyticsSiteEntity>().exec();
    const site = entity ? WebAnalyticsSiteSerializer.normalize(entity) : null;
    await this.redis.set(key, JSON.stringify(site), 10);
    return site;
  }

  public async readExistingSiteIds(ids: string[]): Promise<Set<string>> {
    const sites = await this.model
      .find({ _id: { $in: ids } })
      .select('_id')
      .lean<WebAnalyticsSiteEntity[]>()
      .exec();
    return new Set(sites.map((site) => site._id.toString()));
  }

  public async readStatus(clusterId: string): Promise<WebAnalyticsStatusResponse> {
    const [web, projects] = await Promise.all([
      this.query<{ last: string | null }>(
        'SELECT maxOrNull(received_at) AS last FROM web_events WHERE cluster_id = {clusterId:FixedString(24)} AND expires_at > now()',
        { clusterId },
      ),
      this.projects.readByClusterId(clusterId),
    ]);
    const logs = await Promise.all(
      projects.map((project) => this.logs.getLastLogReceivedAt(project.id)),
    );
    const lastLog = logs.reduce<Date | null>(
      (latest, date) => (date && (!latest || date > latest) ? date : latest),
      null,
    );
    return {
      lastWebEventAt: web[0]?.last
        ? ClickhouseUtils.clickhouseDateToJsDate(web[0].last).toISOString()
        : null,
      lastLogAt: lastLog?.toISOString() ?? null,
    };
  }

  public async readReport(
    clusterId: string,
    query: ReadWebAnalyticsQuery,
    retentionDays: number,
  ): Promise<WebAnalyticsResponse> {
    const scope = this.scope(clusterId, query, retentionDays);
    const [summary, previous, series, previousSeries, online, breakdowns] = await Promise.all([
      this.readSummary(scope, scope.params),
      this.readSummary(scope, scope.previousParams),
      this.readSeries(scope, scope.params),
      query.compare ? this.readSeries(scope, scope.previousParams) : undefined,
      this.readOnline(clusterId),
      this.readBreakdowns(scope, 10),
    ]);
    return {
      from: scope.from.toISOString(),
      to: scope.to.toISOString(),
      granularity: query.granularity,
      retentionDays,
      summary,
      previous,
      series,
      previousSeries,
      goalSeries: await this.readGoalSeries(
        scope,
        series,
        breakdowns.goals.slice(0, 5).map((goal) => goal.name),
      ),
      online,
      breakdowns,
    };
  }

  public async readOverview(
    clusterId: string,
    query: ReadWebAnalyticsQuery,
    retentionDays: number,
  ): Promise<WebAnalyticsOverviewResponse> {
    const scope = this.scope(clusterId, query, retentionDays);
    const [visitors, series, online] = await Promise.all([
      this.query<{ visitors: string }>(
        `SELECT uniqExact(${PERSON}) AS visitors FROM web_events FINAL WHERE ${scope.where}`,
        scope.params,
      ),
      this.readSeries(scope, scope.params),
      this.readOnline(clusterId),
    ]);
    return { visitors: Number(visitors[0]?.visitors ?? 0), series, online };
  }

  private async readOnline(clusterId: string): Promise<number> {
    const rows = await this.query<{ online: string }>(
      `SELECT uniqExact(${PERSON}) AS online FROM web_events FINAL
      WHERE cluster_id = {clusterId:FixedString(24)} AND created_at >= {since:DateTime64(3)} AND expires_at > now()
        AND name != 'pageleave'`,
      {
        clusterId,
        since: ClickhouseUtils.jsDateToClickhouseDate(new Date(Date.now() - 5 * 60_000)),
      },
    );
    return Number(rows[0]?.online ?? 0);
  }

  public async readBreakdown(
    clusterId: string,
    query: ReadWebAnalyticsQuery,
    dimension: WebAnalyticsBreakdownName,
    retentionDays: number,
  ): Promise<WebAnalyticsBreakdownRow[]> {
    const scope = this.scope(clusterId, query, retentionDays);
    return (await this.readBreakdowns(scope, 500, [dimension]))[dimension];
  }

  public async readVisitors(
    clusterId: string,
    query: ReadWebAnalyticsQuery,
    retentionDays: number,
    offset: number,
  ): Promise<WebAnalyticsVisitorsResponse> {
    const scope = this.scope(clusterId, query, retentionDays);
    const rows = await this.query<VisitorRow>(
      `${this.visitorSelect()}, count() OVER () AS total
      FROM web_events FINAL WHERE ${scope.where}
      GROUP BY id ORDER BY last_seen DESC, id LIMIT 50 OFFSET {offset:UInt32}`,
      { ...scope.params, offset },
    );
    return {
      visitors: rows.map((row) => this.toVisitor(row)),
      total: Number(rows[0]?.total ?? 0),
    };
  }

  public async readVisitor(
    clusterId: string,
    visitorId: string,
    tz: string,
  ): Promise<WebAnalyticsVisitorResponse> {
    const params = { clusterId, visitorId, tz };
    const where = `cluster_id = {clusterId:FixedString(24)} AND ${PERSON} = {visitorId:String} AND expires_at > now()`;
    const [profile, events] = await Promise.all([
      this.query<VisitorRow>(
        `${this.visitorSelect()} FROM web_events FINAL WHERE ${where} GROUP BY id`,
        params,
      ),
      this.query<{
        time: string;
        name: string;
        path: string;
        hostname: string;
        session_id: string;
        source: string;
      }>(
        `SELECT created_at AS time, name, path, hostname, session_id, ${SOURCE} AS source
        FROM web_events FINAL WHERE ${where} AND name != 'pageleave' ORDER BY created_at DESC LIMIT 300`,
        params,
      ),
    ]);
    return {
      visitor: profile[0] ? this.toVisitor(profile[0]) : null,
      events: events.map((event) => ({
        time: ClickhouseUtils.clickhouseDateToJsDate(event.time).toISOString(),
        name: event.name,
        path: event.path,
        hostname: event.hostname,
        sessionId: event.session_id,
        source: event.source,
      })),
    };
  }

  public async readJourneys(
    clusterId: string,
    query: ReadWebAnalyticsQuery,
    retentionDays: number,
  ): Promise<WebAnalyticsJourneysResponse> {
    const scope = this.scope(clusterId, query, retentionDays);
    const rows = await this.query<{ steps: string[]; sessions: string }>(
      `SELECT steps, count() AS sessions FROM (${this.sessions(scope)})
      WHERE length(steps) > 1 GROUP BY steps ORDER BY sessions DESC, steps LIMIT 25`,
      scope.params,
    );
    return {
      journeys: rows.map((row) => ({ steps: row.steps, sessions: Number(row.sessions) })),
    };
  }

  public async readFunnel(
    clusterId: string,
    query: ReadWebAnalyticsFunnelQuery,
    retentionDays: number,
  ): Promise<WebAnalyticsFunnelResponse> {
    const scope = this.scope(clusterId, query, retentionDays);
    const params: Record<string, unknown> = {
      ...scope.params,
      window: Math.ceil((scope.to.getTime() - scope.from.getTime()) / 1000),
    };
    const conditions = query.step.map((step, index) => {
      const [kind, ...rest] = step.split(':');
      params[`step${index}`] = rest.join(':');
      return kind === 'page'
        ? `name = 'pageview' AND path = {step${index}:String}`
        : `name = {step${index}:String} AND name NOT IN ${NOT_A_GOAL}`;
    });
    const rows = await this.query<{ level: number; visitors: string }>(
      `SELECT level, count() AS visitors FROM (
        SELECT windowFunnel({window:UInt64})(toDateTime(created_at), ${conditions.join(', ')}) AS level
        FROM web_events FINAL WHERE ${scope.where} GROUP BY ${PERSON}
      ) GROUP BY level`,
      params,
    );
    return {
      steps: query.step.map((step, index) => ({
        step,
        visitors: rows
          .filter((row) => Number(row.level) > index)
          .reduce((sum, row) => sum + Number(row.visitors), 0),
      })),
    };
  }

  public async readRetention(
    clusterId: string,
    query: ReadWebAnalyticsQuery,
    retentionDays: number,
  ): Promise<WebAnalyticsRetentionResponse> {
    const scope = this.scope(clusterId, query, retentionDays);
    const params = {
      ...scope.params,
      historyStart: ClickhouseUtils.jsDateToClickhouseDate(
        new Date(Date.now() - retentionDays * 86_400_000),
      ),
      now: ClickhouseUtils.jsDateToClickhouseDate(new Date()),
    };
    const day = (column: string): string => `toDate(${column}, {tz:String})`;
    const inRange = 'created_at >= {from:DateTime64(3)} AND created_at < {to:DateTime64(3)}';
    const users = `SELECT min(created_at) AS first_seen, ${day('first_seen')} AS cohort,
        groupUniqArray(${day('created_at')}) AS active_days,
        uniqExactIf(${day('created_at')}, ${inRange}) AS days_in_range,
        countIf(created_at >= subtractDays({to:DateTime64(3)}, 30) AND created_at < {to:DateTime64(3)}) > 0 AS monthly,
        days_in_range > 0 AND countIf(created_at < {from:DateTime64(3)}) > 0 AS returning,
        dateDiff('day', ${day('maxIf(created_at, created_at < {from:DateTime64(3)})')}, ${day(`minIf(created_at, ${inRange})`)}) AS gap
      FROM web_events FINAL
      WHERE cluster_id = {clusterId:FixedString(24)} AND user_id != '' AND expires_at > now()
        AND created_at >= {historyStart:DateTime64(3)}
      GROUP BY user_id`;
    const [cohorts, totals] = await Promise.all([
      this.query<Omit<WebAnalyticsCohort, 'users'> & { users: string }>(
        `SELECT toString(cohort) AS date, count() AS users, ${RETENTION_DAYS.map(
          (offset) =>
            `if(cohort + ${offset} < ${day('{now:DateTime64(3)}')}, countIf(has(active_days, cohort + ${offset})) / count() * 100, NULL) AS day${offset}`,
        ).join(', ')}
        FROM (${users}) WHERE first_seen >= {from:DateTime64(3)} AND first_seen < {to:DateTime64(3)}
        GROUP BY cohort ORDER BY cohort DESC`,
        params,
      ),
      this.query<Record<string, string>>(
        `SELECT dateDiff('day', ${day('{from:DateTime64(3)}')}, ${day('subtractMilliseconds({to:DateTime64(3)}, 1)')}) + 1 AS days,
          sum(days_in_range) AS active, countIf(monthly) AS monthly,
          ${COMEBACK_DAYS.map((minDays) => `countIf(returning AND gap >= ${minDays}) AS comeback${minDays}`).join(', ')}
        FROM (${users})`,
        params,
      ),
    ]);
    const dailyActive = Number(totals[0].active) / Number(totals[0].days);
    const monthlyActive = Number(totals[0].monthly);
    return {
      cohorts: cohorts.map((row) => ({ ...row, users: Number(row.users) })),
      stickiness: {
        dailyActive,
        monthlyActive,
        ratio: monthlyActive ? (dailyActive / monthlyActive) * 100 : null,
      },
      comebacks: COMEBACK_DAYS.map((minDays) => ({
        minDays,
        users: Number(totals[0][`comeback${minDays}`]),
      })),
    };
  }

  public async readEvent(
    clusterId: string,
    name: string,
    query: ReadWebAnalyticsQuery,
    retentionDays: number,
  ): Promise<WebAnalyticsEventResponse> {
    const scope = this.scope(clusterId, query, retentionDays);
    const [summary, previous, series, previousSeries, properties] = await Promise.all([
      this.readEventSummary(scope, scope.params, name),
      this.readEventSummary(scope, scope.previousParams, name),
      this.readEventSeries(scope, scope.params, name),
      query.compare ? this.readEventSeries(scope, scope.previousParams, name) : undefined,
      this.query<{ label: string; visitors: string; count: string }>(
        `SELECT key AS label, uniqExact(${PERSON}) AS visitors, count() AS count
        FROM web_events FINAL ARRAY JOIN mapKeys(props) AS key
        WHERE ${scope.where} AND name = {event:String}
        GROUP BY label ORDER BY count DESC, label ASC LIMIT 50`,
        { ...scope.params, event: name },
      ),
    ]);
    return {
      from: scope.from.toISOString(),
      to: scope.to.toISOString(),
      granularity: query.granularity,
      summary,
      previous,
      series,
      previousSeries,
      properties: properties.map((row) => ({
        name: row.label,
        visitors: Number(row.visitors),
        count: Number(row.count),
      })),
    };
  }

  public async readEventProperty(
    clusterId: string,
    name: string,
    key: string,
    query: ReadWebAnalyticsQuery,
    retentionDays: number,
  ): Promise<WebAnalyticsBreakdownRow[]> {
    const scope = this.scope(clusterId, query, retentionDays);
    const rows = await this.query<{ label: string; visitors: string; count: string }>(
      `SELECT props[{key:String}] AS label, uniqExact(${PERSON}) AS visitors, count() AS count
      FROM web_events FINAL
      WHERE ${scope.where} AND name = {event:String} AND mapContains(props, {key:String})
      GROUP BY label ORDER BY count DESC, visitors DESC, label ASC LIMIT 501`,
      { ...scope.params, event: name, key },
    );
    return rows.map((row) => ({
      name: row.label,
      visitors: Number(row.visitors),
      count: Number(row.count),
    }));
  }

  private async readEventSummary(
    scope: Scope,
    params: Record<string, unknown>,
    name: string,
  ): Promise<WebAnalyticsEventSummary> {
    const rows = await this.query<{ count: string; visitors: string; total: string }>(
      `SELECT countIf(name = {event:String}) AS count,
        uniqExactIf(${PERSON}, name = {event:String}) AS visitors, uniqExact(${PERSON}) AS total
      FROM web_events FINAL WHERE ${scope.where}`,
      { ...params, event: name },
    );
    const visitors = Number(rows[0]?.visitors ?? 0);
    const total = Number(rows[0]?.total ?? 0);
    return {
      count: Number(rows[0]?.count ?? 0),
      visitors,
      conversionRate: total ? (visitors / total) * 100 : 0,
    };
  }

  private async readEventSeries(
    scope: Scope,
    params: Record<string, unknown>,
    name: string,
  ): Promise<WebAnalyticsEventPoint[]> {
    const [buckets, rows] = await Promise.all([
      this.readBuckets(scope, params),
      this.query<{ time: string; count: string }>(
        `SELECT toUnixTimestamp(${scope.bucket('created_at')}) * 1000 AS time, count() AS count
        FROM web_events FINAL WHERE ${scope.where} AND name = {event:String} GROUP BY time`,
        { ...params, event: name },
      ),
    ]);
    const counts = new Map(rows.map((row) => [Number(row.time), Number(row.count)]));
    return buckets.map((time) => ({ time, count: counts.get(time) ?? 0 }));
  }

  private scope(clusterId: string, query: ReadWebAnalyticsQuery, retentionDays: number): Scope {
    const now = Date.now();
    const to = new Date(Math.min(query.to.getTime(), now));
    const from = new Date(Math.max(query.from.getTime(), now - retentionDays * 86_400_000));
    if (from >= to) throw new BadRequestException('from must be before to and within retention');
    const bucket = BUCKETS[query.granularity];
    if ((to.getTime() - from.getTime()) / bucket.ms > MAX_BUCKETS)
      throw new BadRequestException('Choose a coarser granularity for this range');
    const filters = new Map<string, string>();
    const window =
      'cluster_id = {clusterId:FixedString(24)} AND created_at >= {from:DateTime64(3)} AND created_at < {to:DateTime64(3)}';
    const conditions = query.filter.map((filter, index) => {
      const separator = filter.indexOf(':');
      const dimension = filter.slice(0, separator) as WebAnalyticsFilterDimension;
      filters.set(`filter${index}`, filter.slice(separator + 1));
      const value = `{filter${index}:String}`;
      if (dimension.startsWith('prop.')) {
        filters.set(`filterKey${index}`, dimension.slice(5));
        const key = `{filterKey${index}:String}`;
        // Events that carry the key must match it, so a breakdown shows only that value; other events follow their visitor.
        return `if(mapContains(props, ${key}), props[${key}] = ${value}, ${PERSON} IN (SELECT ${PERSON} FROM web_events WHERE ${window} AND props[${key}] = ${value}))`;
      }
      if (dimension === 'page')
        return `session_id IN (SELECT session_id FROM web_events WHERE ${window} AND name = 'pageview' AND path = ${value})`;
      if (dimension === 'goal')
        return `${PERSON} IN (SELECT ${PERSON} FROM web_events WHERE ${window} AND name = ${value} AND name NOT IN ${NOT_A_GOAL})`;
      return `${FILTER_COLUMNS[dimension]} = ${value}`;
    });
    const span = to.getTime() - from.getTime();
    const shared = { clusterId, tz: query.tz, ...Object.fromEntries(filters) };
    const filter = conditions.length ? conditions.join(' AND ') : '1';
    return {
      where: `${window} AND expires_at > now() AND ${filter}`,
      filter,
      params: {
        ...shared,
        from: ClickhouseUtils.jsDateToClickhouseDate(from),
        to: ClickhouseUtils.jsDateToClickhouseDate(to),
      },
      previousParams: {
        ...shared,
        from: ClickhouseUtils.jsDateToClickhouseDate(new Date(from.getTime() - span)),
        to: ClickhouseUtils.jsDateToClickhouseDate(from),
      },
      bucket: (column) => `toDateTime(${bucket.start}(${column}, {tz:String}), {tz:String})`,
      addBuckets: bucket.add,
      buckets: Math.ceil((to.getTime() - from.getTime()) / bucket.ms) + 1,
      from,
      to,
    };
  }

  private async readSummary(
    scope: Scope,
    params: Record<string, unknown>,
  ): Promise<WebAnalyticsSummary> {
    const [events, sessions] = await Promise.all([
      this.query<{ visitors: string; pageviews: string; converted: string }>(
        `SELECT uniqExact(${PERSON}) AS visitors, countIf(name = 'pageview') AS pageviews,
          uniqExactIf(${PERSON}, name NOT IN ${NOT_A_GOAL}) AS converted
        FROM web_events FINAL WHERE ${scope.where}`,
        params,
      ),
      this.query<{ sessions: string; bounces: string; duration: number | null }>(
        `SELECT count() AS sessions, countIf(bounce) AS bounces, avgOrNull(duration) AS duration
        FROM (${this.sessions(scope)})`,
        params,
      ),
    ]);
    const visitors = Number(events[0]?.visitors ?? 0);
    const sessionCount = Number(sessions[0]?.sessions ?? 0);
    return {
      visitors,
      pageviews: Number(events[0]?.pageviews ?? 0),
      sessions: sessionCount,
      bounceRate: sessionCount ? (Number(sessions[0].bounces) / sessionCount) * 100 : 0,
      sessionSeconds: Math.round(sessions[0]?.duration ?? 0),
      conversionRate: visitors ? (Number(events[0].converted) / visitors) * 100 : 0,
    };
  }

  private async readSeries(
    scope: Scope,
    params: Record<string, unknown>,
  ): Promise<WebAnalyticsPoint[]> {
    const [buckets, rows] = await Promise.all([
      this.readBuckets(scope, params),
      this.query<{ time: string; visitors: string; pageviews: string }>(
        `SELECT toUnixTimestamp(${scope.bucket('created_at')}) * 1000 AS time,
          uniqExact(${PERSON}) AS visitors, countIf(name = 'pageview') AS pageviews
        FROM web_events FINAL WHERE ${scope.where} GROUP BY time`,
        params,
      ),
    ]);
    const byTime = new Map(rows.map((row) => [Number(row.time), row]));
    return buckets.map((time) => {
      const row = byTime.get(time);
      return {
        time,
        visitors: Number(row?.visitors ?? 0),
        pageviews: Number(row?.pageviews ?? 0),
      };
    });
  }

  private async readBuckets(scope: Scope, params: Record<string, unknown>): Promise<number[]> {
    const add = scope.addBuckets;
    const rows = await this.query<{ time: string }>(
      `SELECT toUnixTimestamp(${add}(${scope.bucket('{from:DateTime64(3)}')}, number)) * 1000 AS time
      FROM numbers(${scope.buckets})
      WHERE ${add}(${scope.bucket('{from:DateTime64(3)}')}, number) < {to:DateTime64(3)}`,
      params,
    );
    return rows.map((row) => Number(row.time));
  }

  private async readGoalSeries(
    scope: Scope,
    series: WebAnalyticsPoint[],
    goals: string[],
  ): Promise<{ name: string; counts: number[] }[]> {
    if (!goals.length) return [];
    const rows = await this.query<{ time: string; name: string; count: string }>(
      `SELECT toUnixTimestamp(${scope.bucket('created_at')}) * 1000 AS time, name, count() AS count
      FROM web_events FINAL WHERE ${scope.where} AND name IN {goals:Array(String)} GROUP BY time, name`,
      { ...scope.params, goals },
    );
    return goals.map((name) => {
      const counts = new Map(
        rows.filter((row) => row.name === name).map((row) => [Number(row.time), Number(row.count)]),
      );
      return { name, counts: series.map((point) => counts.get(point.time) ?? 0) };
    });
  }

  private async readBreakdowns(
    scope: Scope,
    limit: number,
    only?: WebAnalyticsBreakdownName[],
  ): Promise<WebAnalyticsBreakdowns> {
    const wanted = (name: WebAnalyticsBreakdownName): boolean => !only || only.includes(name);
    const pageviewDimensions = Object.entries(PAGEVIEW_BREAKDOWNS).filter(([name]) =>
      wanted(name as WebAnalyticsBreakdownName),
    );
    const entries = [
      ...pageviewDimensions.map(
        ([name, column]) => `('${name}', if(name = 'pageview', ${column}, ''))`,
      ),
      ...(wanted('goals') ? [`('goals', if(name NOT IN ${NOT_A_GOAL}, name, ''))`] : []),
    ];
    const params = { ...scope.params, limit };
    const [rows, sessionRows] = await Promise.all([
      entries.length
        ? this.query<{ dimension: string; label: string; visitors: string; count: string }>(
            `SELECT entry.1 AS dimension, entry.2 AS label, uniqExact(${PERSON}) AS visitors, count() AS count
            FROM web_events FINAL ARRAY JOIN [${entries.join(', ')}] AS entry
            WHERE ${scope.where} AND entry.2 != ''
            GROUP BY dimension, label ORDER BY visitors DESC, count DESC, label ASC LIMIT {limit:UInt32} BY dimension`,
            params,
          )
        : [],
      wanted('entryPages') || wanted('exitPages')
        ? this.query<{ dimension: string; label: string; visitors: string; count: string }>(
            `SELECT entry.1 AS dimension, entry.2 AS label, uniqExact(visitor) AS visitors, count() AS count
            FROM (${this.sessions(scope)})
            ARRAY JOIN [('entryPages', entry_page), ('exitPages', exit_page)] AS entry
            GROUP BY dimension, label ORDER BY visitors DESC, count DESC, label ASC LIMIT {limit:UInt32} BY dimension`,
            params,
          )
        : [],
    ]);
    const all = [...rows, ...sessionRows];
    const pick = (dimension: WebAnalyticsBreakdownName): WebAnalyticsBreakdownRow[] =>
      all
        .filter((row) => row.dimension === dimension)
        .map((row) => ({
          name: row.label,
          visitors: Number(row.visitors),
          count: Number(row.count),
        }));
    return {
      channels: pick('channels'),
      referrers: pick('referrers'),
      campaigns: pick('campaigns'),
      keywords: pick('keywords'),
      hostnames: pick('hostnames'),
      pages: pick('pages'),
      entryPages: pick('entryPages'),
      exitPages: pick('exitPages'),
      countries: pick('countries'),
      browsers: pick('browsers'),
      os: pick('os'),
      devices: pick('devices'),
      goals: pick('goals'),
    };
  }

  // ponytail: sessions are rebuilt from raw events scanned with a 24 h pad on both sides of the range, upgrade to a sessions table fed by a materialized view when that scan gets slow
  private sessions(scope: Scope): string {
    return `SELECT any(${PERSON}) AS visitor, min(created_at) AS started_at,
        countIf(name = 'pageview') AS pageviews,
        dateDiff('millisecond', started_at, max(created_at)) / 1000 AS duration,
        NOT (pageviews > 1 OR countIf(name NOT IN ${NOT_A_GOAL}) > 0 OR duration >= 10) AS bounce,
        argMinIf(path, created_at, name = 'pageview') AS entry_page,
        argMaxIf(path, created_at, name = 'pageview') AS exit_page,
        arraySlice(arrayMap(entry -> entry.2, arraySort(groupArrayIf((created_at, path), name = 'pageview'))), 1, 5) AS steps
      FROM web_events FINAL
      WHERE cluster_id = {clusterId:FixedString(24)} AND expires_at > now()
        AND created_at >= subtractDays({from:DateTime64(3)}, 1) AND created_at < addDays({to:DateTime64(3)}, 1)
      GROUP BY session_id
      HAVING started_at >= {from:DateTime64(3)} AND started_at < {to:DateTime64(3)} AND pageviews > 0
        AND countIf(${scope.filter}) > 0`;
  }

  private visitorSelect(): string {
    return `SELECT ${PERSON} AS id, any(user_id != '') AS identified,
      min(created_at) AS first_seen, max(created_at) AS last_seen,
      argMax(country, created_at) AS last_country, argMax(device, created_at) AS last_device,
      argMax(os, created_at) AS last_os, argMax(browser, created_at) AS last_browser,
      argMin(${SOURCE}, created_at) AS source,
      uniqExact(session_id) AS sessions, countIf(name = 'pageview') AS pageviews,
      arraySort(groupUniqArray(toString(toDate(created_at, {tz:String})))) AS active_days`;
  }

  private toVisitor(row: VisitorRow): WebAnalyticsVisitor {
    return {
      id: row.id,
      identified: row.identified === 1,
      firstSeen: ClickhouseUtils.clickhouseDateToJsDate(row.first_seen).toISOString(),
      lastSeen: ClickhouseUtils.clickhouseDateToJsDate(row.last_seen).toISOString(),
      country: row.last_country,
      device: row.last_device,
      os: row.last_os,
      browser: row.last_browser,
      source: row.source,
      sessions: Number(row.sessions),
      pageviews: Number(row.pageviews),
      activeDays: row.active_days,
    };
  }

  private async query<T>(query: string, queryParams: Record<string, unknown>): Promise<T[]> {
    const result = await this.clickhouse.query({ query, query_params: queryParams });
    return (await result.json<T>()).data;
  }
}
