import { ClickHouseClient } from '@clickhouse/client';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WebAnalyticsSiteEntity } from '../core/entities/web-analytics-site.entity';
import {
  WebAnalyticsInsightNormalized,
  WebAnalyticsLayoutNormalized,
} from '../core/entities/web-analytics-site.interface';
import { WebAnalyticsSiteSerializer } from '../core/entities/web-analytics-site.serializer';
import {
  WebAnalyticsFunnelMode,
  WebAnalyticsInsightBucket,
  WebAnalyticsInsightConfig,
  WebAnalyticsInsightFilter,
  WebAnalyticsInsightMeasure,
  WebAnalyticsInsightOperator,
  WebAnalyticsInsightType,
} from '../core/dto/web-analytics-insight.body';
import {
  WebAnalyticsInsightResult,
  WebAnalyticsSchemaResponse,
} from '../core/dto/web-analytics-insight.response';
import {
  ReadWebAnalyticsQuery,
  WebAnalyticsGranularity,
} from '../core/dto/read-web-analytics.query';
import { Scope, WebAnalyticsReadService } from './web-analytics-read.service';

const OPERATORS: Record<WebAnalyticsInsightOperator, string> = {
  [WebAnalyticsInsightOperator.Eq]: '=',
  [WebAnalyticsInsightOperator.Neq]: '!=',
  [WebAnalyticsInsightOperator.Gt]: '>',
  [WebAnalyticsInsightOperator.Gte]: '>=',
  [WebAnalyticsInsightOperator.Lt]: '<',
  [WebAnalyticsInsightOperator.Lte]: '<=',
};

const COHORT_START: Record<string, string> = {
  [WebAnalyticsGranularity.Day]: 'toDate',
  [WebAnalyticsGranularity.Week]: 'toMonday',
  [WebAnalyticsGranularity.Month]: 'toStartOfMonth',
};

// Last day of a cohort that starts on `cohort_start`.
const COHORT_END: Record<string, string> = {
  [WebAnalyticsGranularity.Day]: 'cohort_start',
  [WebAnalyticsGranularity.Week]: 'addDays(cohort_start, 6)',
  [WebAnalyticsGranularity.Month]: 'toLastDayOfMonth(cohort_start)',
};

const MAX_BINS = 500;

type Conditions = {
  events: string[];
  all: string;
  params: Record<string, unknown>;
};

// The bucket each trend line counts per: its own, else the one of the insight, else day.
function lineBuckets(insight: WebAnalyticsInsightConfig): WebAnalyticsInsightBucket[] {
  return (insight.events ?? []).map(
    (event) => event.bucket ?? insight.bucket ?? WebAnalyticsGranularity.Day,
  );
}

// Lines with different buckets share a day axis, where every bucket starts on a tick.
function trendAxis(buckets: WebAnalyticsInsightBucket[]): WebAnalyticsInsightBucket {
  return new Set(buckets).size === 1 ? buckets[0] : WebAnalyticsGranularity.Day;
}

// Repeats the count of each bucket on every tick it spans. The first bucket can start before the first tick.
function spread(ticks: number[], starts: number[], counts: number[]): number[] {
  let at = 0;
  return ticks.map((tick) => {
    while (at + 1 < starts.length && starts[at + 1] <= tick) at++;
    return counts[at] ?? 0;
  });
}

@Injectable()
export class WebAnalyticsInsightReadService {
  constructor(
    @InjectModel(WebAnalyticsSiteEntity.name) private readonly model: Model<WebAnalyticsSiteEntity>,
    private readonly clickhouse: ClickHouseClient,
    private readonly read: WebAnalyticsReadService,
  ) {}

  public async readLayout(clusterId: string): Promise<WebAnalyticsLayoutNormalized> {
    const site = await this.model
      .findOne({ clusterId })
      .select('insights views viewsVersion')
      .lean<WebAnalyticsSiteEntity>()
      .exec();
    return WebAnalyticsSiteSerializer.normalizeLayout(site);
  }

  public async readInsightOrThrow(
    clusterId: string,
    insightId: string,
  ): Promise<WebAnalyticsInsightNormalized> {
    const insight = Types.ObjectId.isValid(insightId)
      ? (await this.readLayout(clusterId)).insights.find((entry) => entry.id === insightId)
      : undefined;
    if (!insight) throw new NotFoundException('Insight not found');
    return insight;
  }

  public async readSchema(
    clusterId: string,
    days: number,
    retentionDays: number,
  ): Promise<WebAnalyticsSchemaResponse> {
    const scope = this.read.scope(clusterId, this.window(days, 'UTC'), retentionDays);
    const rows = await this.query<{ name: string; count: string; properties: string[] }>(
      `SELECT name, count() AS count, arraySort(groupUniqArrayArray(mapKeys(props))) AS properties
      FROM web_events FINAL WHERE ${scope.where}
      GROUP BY name ORDER BY count DESC, name ASC LIMIT 300`,
      scope.params,
    );
    return {
      from: scope.from.toISOString(),
      to: scope.to.toISOString(),
      events: rows.map((row) => ({
        name: row.name,
        count: Number(row.count),
        properties: row.properties,
      })),
    };
  }

  public async run(
    clusterId: string,
    insight: WebAnalyticsInsightConfig,
    tz: string,
    retentionDays: number,
  ): Promise<WebAnalyticsInsightResult> {
    if (insight.type === WebAnalyticsInsightType.Tabs)
      throw new BadRequestException('Run each tab on its own');
    const query = this.window(
      insight.days,
      tz,
      insight.type === WebAnalyticsInsightType.Trend
        ? trendAxis(lineBuckets(insight))
        : insight.bucket,
    );
    const scope = this.read.scope(clusterId, query, retentionDays);
    const range = {
      type: insight.type,
      from: scope.from.toISOString(),
      to: scope.to.toISOString(),
    };
    if (
      insight.type === WebAnalyticsInsightType.Funnel &&
      insight.mode === WebAnalyticsFunnelMode.People
    ) {
      const funnel = await this.read.readFunnel(
        clusterId,
        { ...query, step: insight.steps ?? [] },
        retentionDays,
      );
      return {
        ...range,
        steps: funnel.steps.map((step) => ({ name: step.step, count: step.visitors })),
      };
    }
    const conditions = this.conditions(insight, scope);
    if (insight.type === WebAnalyticsInsightType.Funnel)
      return { ...range, ...(await this.readEventsFunnel(insight, scope, conditions)) };
    if (insight.type === WebAnalyticsInsightType.Trend)
      return {
        ...range,
        ...(await this.readTrend(insight, scope, conditions, (bucket) =>
          this.read.scope(clusterId, { ...query, granularity: bucket }, retentionDays),
        )),
      };
    if (insight.type === WebAnalyticsInsightType.Distribution)
      return { ...range, ...(await this.readDistribution(insight, scope, conditions)) };
    return { ...range, ...(await this.readCohorts(insight, scope, conditions)) };
  }

  private async readEventsFunnel(
    insight: WebAnalyticsInsightConfig,
    scope: Scope,
    conditions: Conditions,
  ): Promise<Pick<WebAnalyticsInsightResult, 'steps'>> {
    const counts = await this.totals(scope, conditions);
    return {
      steps: (insight.events ?? []).map((event, index) => ({
        name: event.name,
        count: counts[index],
      })),
    };
  }

  private async readTrend(
    insight: WebAnalyticsInsightConfig,
    scope: Scope,
    conditions: Conditions,
    scopeOf: (bucket: WebAnalyticsGranularity) => Scope,
  ): Promise<Pick<WebAnalyticsInsightResult, 'times' | 'bucket' | 'measure' | 'series'>> {
    const events = insight.events ?? [];
    const buckets = lineBuckets(insight);
    const axis = trendAxis(buckets);
    const people = insight.measure === WebAnalyticsInsightMeasure.People;
    const times = this.read.readBuckets(scope, scope.params);
    // People of the whole period are not the sum of the people of each bucket, so they get a query of their own.
    const distinct = people ? this.totals(scope, conditions, true) : undefined;
    // One query per bucket, which counts only the lines of that bucket.
    const groups = await Promise.all(
      [...new Set(buckets)].map(async (bucket) => {
        const lines = buckets.flatMap((own, index) => (own === bucket ? [index] : []));
        const group = bucket === axis ? scope : scopeOf(bucket);
        const [ticks, starts, rows, totals] = await Promise.all([
          times,
          bucket === axis ? times : this.read.readBuckets(group, scope.params),
          this.query<Record<string, string>>(
            `SELECT toUnixTimestamp(${group.bucket('created_at')}) * 1000 AS time, ${this.counts(conditions, lines, people)}
            FROM web_events FINAL
            WHERE ${scope.where} AND name IN {names:Array(String)} AND ${conditions.all}
            GROUP BY time`,
            conditions.params,
          ),
          distinct,
        ]);
        const byTime = new Map(rows.map((row) => [Number(row.time), row]));
        return lines.map((line) => {
          const counts = starts.map((start) => Number(byTime.get(start)?.[`s${line}`] ?? 0));
          return [
            line,
            {
              name: events[line].name,
              ...(events[line].label ? { label: events[line].label } : {}),
              bucket,
              counts: spread(ticks, starts, counts),
              total: totals?.[line] ?? counts.reduce((total, count) => total + count, 0),
            },
          ] as const;
        });
      }),
    );
    return {
      times: await times,
      bucket: axis,
      measure: people ? WebAnalyticsInsightMeasure.People : WebAnalyticsInsightMeasure.Events,
      series: groups
        .flat()
        .sort(([a], [b]) => a - b)
        .map(([, series]) => series),
    };
  }

  private async readDistribution(
    insight: WebAnalyticsInsightConfig,
    scope: Scope,
    conditions: Conditions,
  ): Promise<Pick<WebAnalyticsInsightResult, 'measure' | 'bins' | 'summary'>> {
    const people = insight.measure === WebAnalyticsInsightMeasure.People;
    const where = `${scope.where} AND ${conditions.events[0]} AND ${conditions.all}`;
    const number = 'toFloat64OrNull(props[{property:String}])';
    const values = people
      ? `SELECT uniqExact(toDate(created_at, {tz:String})) AS value FROM web_events FINAL
        WHERE ${where} AND user_id != '' GROUP BY user_id`
      : `SELECT ${number} AS value FROM web_events FINAL WHERE ${where} AND isFinite(${number})`;
    const params = { ...conditions.params, property: insight.property, bin: insight.binSize };
    const [rows, summary] = await Promise.all([
      this.query<{ bin: string; count: string }>(
        `SELECT floor(value / {bin:Float64}) AS bin, count() AS count
        FROM (${values}) GROUP BY bin ORDER BY bin`,
        params,
      ),
      this.query<{ count: string; mean: number | null; median: number | string | null }>(
        `SELECT count() AS count, avgOrNull(value) AS mean, quantileExactOrNull(0.5)(value) AS median
        FROM (${values})`,
        params,
      ),
    ]);
    const counts = new Map(rows.map((row) => [Number(row.bin), Number(row.count)]));
    const total = Number(summary[0]?.count ?? 0);
    const first = rows.length ? Number(rows[0].bin) : 0;
    const size = rows.length ? Number(rows[rows.length - 1].bin) - first + 1 : 0;
    if (size > MAX_BINS)
      throw new BadRequestException(
        `Use a larger bin size: this one makes ${size} bars, at most ${MAX_BINS}`,
      );
    const binSize = insight.binSize ?? 1;
    return {
      measure: people ? WebAnalyticsInsightMeasure.People : WebAnalyticsInsightMeasure.Events,
      bins: Array.from({ length: size }, (_, index) => {
        const count = counts.get(first + index) ?? 0;
        return {
          value: Number(((first + index) * binSize).toPrecision(12)),
          count,
          share: total ? (count / total) * 100 : 0,
        };
      }),
      summary: {
        count: total,
        mean: total ? Number(summary[0].mean) : null,
        median: total ? Number(summary[0].median) : null,
      },
    };
  }

  private async readCohorts(
    insight: WebAnalyticsInsightConfig,
    scope: Scope,
    conditions: Conditions,
  ): Promise<Pick<WebAnalyticsInsightResult, 'cohorts' | 'lagDays'>> {
    const bucket = insight.bucket ?? WebAnalyticsGranularity.Week;
    const source = `SELECT name, props, created_at, toDateOrNull(props[{cohortKey:String}]) AS cohort_day
      FROM web_events FINAL
      WHERE cluster_id = {clusterId:FixedString(24)} AND expires_at > now()
        AND created_at >= subtractDays({from:DateTime64(3)}, 2) AND created_at < {to:DateTime64(3)}
        AND name IN {names:Array(String)} AND ${conditions.all}`;
    const inRange = `cohort_day >= toDate({from:DateTime64(3)}, {tz:String}) AND cohort_day <= toDate({to:DateTime64(3)}, {tz:String})`;
    const params = { ...conditions.params, cohortKey: insight.property };
    // ponytail: young cohorts cut long delays short, so a lag can read low. Measure it on
    // cohorts older than the period if late steps flag too early.
    const lags = conditions.events
      .map(
        (condition, index) =>
          `quantileExactIf(0.95)(greatest(0, dateDiff('day', cohort_day, toDate(created_at, {tz:String}))), ${condition}) AS l${index}`,
      )
      .join(', ');
    const [rows, [lagRow]] = await Promise.all([
      this.query<Record<string, string>>(
        `SELECT toString(${COHORT_START[bucket]}(cohort_day) AS cohort_start) AS cohort,
          dateDiff('day', ${COHORT_END[bucket]}, toDate({to:DateTime64(3)}, {tz:String})) AS age,
          ${this.counts(conditions)}
        FROM (${source}) WHERE ${inRange}
        GROUP BY cohort_start ORDER BY cohort_start DESC LIMIT 120`,
        params,
      ),
      this.query<Record<string, string>>(
        `SELECT ${lags} FROM (${source}) WHERE ${inRange}`,
        params,
      ),
    ]);
    const lagDays = conditions.events.map((_, index) => Number(lagRow?.[`l${index}`] ?? 0));
    return {
      lagDays,
      cohorts: rows.map((row) => {
        const counts = conditions.events.map((_, index) => Number(row[`s${index}`]));
        return {
          cohort: row.cohort,
          counts,
          shares: counts.map((count) => (counts[0] ? (count / counts[0]) * 100 : null)),
          // The last day of the cohort has not had `lag` full days yet.
          filling: lagDays.map((lag) => Number(row.age) <= lag),
        };
      }),
    };
  }

  private conditions(insight: WebAnalyticsInsightConfig, scope: Scope): Conditions {
    const params: Record<string, unknown> = {
      ...scope.params,
      names: (insight.events ?? []).map((event) => event.name),
    };
    let next = 0;
    const filter = ({ key, op, value }: WebAnalyticsInsightFilter): string => {
      const index = next++;
      params[`key${index}`] = key;
      const prop = `props[{key${index}:String}]`;
      const number = Number(value);
      const numeric =
        op !== WebAnalyticsInsightOperator.Eq &&
        op !== WebAnalyticsInsightOperator.Neq &&
        value.trim() !== '' &&
        Number.isFinite(number);
      params[`value${index}`] = numeric ? number : value;
      const compared = `${numeric ? `toFloat64OrNull(${prop})` : prop} ${OPERATORS[op]} {value${index}:${numeric ? 'Float64' : 'String'}}`;
      return op === WebAnalyticsInsightOperator.Neq
        ? compared
        : `mapContains(props, {key${index}:String}) AND ${compared}`;
    };
    const join = (parts: string[]): string =>
      parts.length ? parts.map((part) => `(${part})`).join(' AND ') : '1';
    return {
      events: (insight.events ?? []).map((event, index) => {
        params[`event${index}`] = event.name;
        return join([`name = {event${index}:String}`, ...event.filters.map(filter)]);
      }),
      all: join((insight.filters ?? []).map(filter)),
      params,
    };
  }

  // Per line: its events, or its distinct people. Only users with an id are people, as a visitor id changes every day.
  private counts(conditions: Conditions, only?: number[], people = false): string {
    return conditions.events
      .map((condition, index) =>
        people
          ? `uniqExactIf(user_id, user_id != '' AND (${condition})) AS s${index}`
          : `countIf(${condition}) AS s${index}`,
      )
      .filter((_, index) => !only || only.includes(index))
      .join(', ');
  }

  // One number per line for the whole period.
  private async totals(scope: Scope, conditions: Conditions, people = false): Promise<number[]> {
    const [row] = await this.query<Record<string, string>>(
      `SELECT ${this.counts(conditions, undefined, people)} FROM web_events FINAL
      WHERE ${scope.where} AND name IN {names:Array(String)} AND ${conditions.all}`,
      conditions.params,
    );
    return conditions.events.map((_, index) => Number(row?.[`s${index}`] ?? 0));
  }

  private window(
    days: number,
    tz: string,
    bucket: WebAnalyticsGranularity = WebAnalyticsGranularity.Day,
  ): ReadWebAnalyticsQuery {
    const to = new Date();
    return {
      from: new Date(to.getTime() - days * 86_400_000),
      to,
      granularity: bucket,
      filter: [],
      tz,
      compare: false,
    };
  }

  private async query<T>(query: string, queryParams: Record<string, unknown>): Promise<T[]> {
    const result = await this.clickhouse.query({ query, query_params: queryParams });
    return (await result.json<T>()).data;
  }
}
