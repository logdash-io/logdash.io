import { ClickHouseClient } from '@clickhouse/client';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WebAnalyticsSiteEntity } from '../core/entities/web-analytics-site.entity';
import { WebAnalyticsInsightNormalized } from '../core/entities/web-analytics-site.interface';
import { WebAnalyticsInsightSerializer } from '../core/entities/web-analytics-site.serializer';
import {
  WebAnalyticsFunnelMode,
  WebAnalyticsInsightConfig,
  WebAnalyticsInsightFilter,
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

const MAX_BINS = 500;

type Conditions = {
  events: string[];
  all: string;
  params: Record<string, unknown>;
};

@Injectable()
export class WebAnalyticsInsightReadService {
  constructor(
    @InjectModel(WebAnalyticsSiteEntity.name) private readonly model: Model<WebAnalyticsSiteEntity>,
    private readonly clickhouse: ClickHouseClient,
    private readonly read: WebAnalyticsReadService,
  ) {}

  public async readInsights(clusterId: string): Promise<WebAnalyticsInsightNormalized[]> {
    const site = await this.model
      .findOne({ clusterId })
      .select('insights')
      .lean<WebAnalyticsSiteEntity>()
      .exec();
    return (site?.insights ?? []).map((insight) =>
      WebAnalyticsInsightSerializer.normalize(insight),
    );
  }

  public async readInsightOrThrow(
    clusterId: string,
    insightId: string,
  ): Promise<WebAnalyticsInsightNormalized> {
    const insight = Types.ObjectId.isValid(insightId)
      ? (await this.readInsights(clusterId)).find((entry) => entry.id === insightId)
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
    const query = this.window(insight.days, tz, insight.bucket);
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
      return { ...range, ...(await this.readTrend(insight, scope, conditions)) };
    if (insight.type === WebAnalyticsInsightType.Distribution)
      return { ...range, ...(await this.readDistribution(insight, scope, conditions)) };
    return { ...range, ...(await this.readCohorts(insight, scope, conditions)) };
  }

  private async readEventsFunnel(
    insight: WebAnalyticsInsightConfig,
    scope: Scope,
    conditions: Conditions,
  ): Promise<Pick<WebAnalyticsInsightResult, 'steps'>> {
    const rows = await this.query<Record<string, string>>(
      `SELECT ${this.counts(conditions)} FROM web_events FINAL
      WHERE ${scope.where} AND name IN {names:Array(String)} AND ${conditions.all}`,
      conditions.params,
    );
    return {
      steps: (insight.events ?? []).map((event, index) => ({
        name: event.name,
        count: Number(rows[0]?.[`s${index}`] ?? 0),
      })),
    };
  }

  private async readTrend(
    insight: WebAnalyticsInsightConfig,
    scope: Scope,
    conditions: Conditions,
  ): Promise<Pick<WebAnalyticsInsightResult, 'times' | 'series'>> {
    const [times, rows] = await Promise.all([
      this.read.readBuckets(scope, scope.params),
      this.query<Record<string, string>>(
        `SELECT toUnixTimestamp(${scope.bucket('created_at')}) * 1000 AS time, ${this.counts(conditions)}
        FROM web_events FINAL
        WHERE ${scope.where} AND name IN {names:Array(String)} AND ${conditions.all}
        GROUP BY time`,
        conditions.params,
      ),
    ]);
    const byTime = new Map(rows.map((row) => [Number(row.time), row]));
    return {
      times,
      series: (insight.events ?? []).map((event, index) => ({
        name: event.name,
        counts: times.map((time) => Number(byTime.get(time)?.[`s${index}`] ?? 0)),
      })),
    };
  }

  private async readDistribution(
    insight: WebAnalyticsInsightConfig,
    scope: Scope,
    conditions: Conditions,
  ): Promise<Pick<WebAnalyticsInsightResult, 'bins' | 'summary'>> {
    const value = 'toFloat64OrNull(props[{property:String}])';
    const where = `${scope.where} AND ${conditions.events[0]} AND ${conditions.all} AND isFinite(${value})`;
    const params = { ...conditions.params, property: insight.property, bin: insight.binSize };
    const [rows, summary] = await Promise.all([
      this.query<{ bin: string; count: string }>(
        `SELECT floor(${value} / {bin:Float64}) AS bin, count() AS count
        FROM web_events FINAL WHERE ${where} GROUP BY bin ORDER BY bin`,
        params,
      ),
      this.query<{ count: string; mean: number | null; median: number | null }>(
        `SELECT count() AS count, avgOrNull(${value}) AS mean, quantileExactOrNull(0.5)(${value}) AS median
        FROM web_events FINAL WHERE ${where}`,
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
  ): Promise<Pick<WebAnalyticsInsightResult, 'cohorts'>> {
    const start = COHORT_START[insight.bucket ?? WebAnalyticsGranularity.Week];
    const rows = await this.query<Record<string, string>>(
      `SELECT toString(${start}(cohort_day)) AS cohort, ${this.counts(conditions)} FROM (
        SELECT name, props, toDateOrNull(props[{cohortKey:String}]) AS cohort_day FROM web_events FINAL
        WHERE cluster_id = {clusterId:FixedString(24)} AND expires_at > now()
          AND created_at >= subtractDays({from:DateTime64(3)}, 2) AND created_at < {to:DateTime64(3)}
          AND name IN {names:Array(String)} AND ${conditions.all}
      )
      WHERE cohort_day >= toDate({from:DateTime64(3)}, {tz:String}) AND cohort_day <= toDate({to:DateTime64(3)}, {tz:String})
      GROUP BY cohort ORDER BY cohort DESC LIMIT 120`,
      { ...conditions.params, cohortKey: insight.property },
    );
    const events = insight.events ?? [];
    return {
      cohorts: rows.map((row) => {
        const counts = events.map((_, index) => Number(row[`s${index}`]));
        return {
          cohort: row.cohort,
          counts,
          shares: counts.map((count) => (counts[0] ? (count / counts[0]) * 100 : null)),
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

  private counts(conditions: Conditions): string {
    return conditions.events
      .map((condition, index) => `countIf(${condition}) AS s${index}`)
      .join(', ');
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
