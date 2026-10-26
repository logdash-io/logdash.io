import { ClickHouseClient } from '@clickhouse/client';
import { BadRequestException, Injectable } from '@nestjs/common';
import {
  ReadWebAnalyticsDayQuery,
  ReadWebAnalyticsDaysQuery,
  ReadWebAnalyticsDayVisitsQuery,
  WebAnalyticsGranularity,
} from '../core/dto/read-web-analytics.query';
import {
  WebAnalyticsDayCounts,
  WebAnalyticsDayGroup,
  WebAnalyticsDayResponse,
  WebAnalyticsDaysResponse,
  WebAnalyticsDayVisitsResponse,
  WebAnalyticsGoalsResponse,
  WebAnalyticsSourceSeries,
} from '../core/dto/web-analytics.response';
import { ClickhouseUtils } from '../../clickhouse/clickhouse.utils';
import {
  NOT_A_GOAL,
  PERSON,
  SOURCE,
  VISIT,
  WebAnalyticsReadService,
} from './web-analytics-read.service';

const DAY_MS = 86_400_000;

const STRIP_DAYS = 28;

const TYPICAL_WEEKS = [1, 2, 3, 4];

const GROUP_LIMIT = 25;

const VISITS_PAGE = 25;

const SECOND_OF_DAY = `toHour(created_at, {tz:String}) * 3600 + toMinute(created_at, {tz:String}) * 60 + toSecond(created_at, {tz:String})`;

type Statement = { sql: string; params: Record<string, unknown> };

type Window = { events: string; filter: string; params: Record<string, unknown> };

type CountsRow = { date: string; visits: string; stayed: string };

type GroupRow = CountsRow & { kind: 'source' | 'page'; label: string; median_seconds: number };

type VisitRow = {
  visitor: string;
  person: string;
  started_at: string;
  last_seen: string;
  source: string;
  entry_page: string;
  exit_page: string;
  pageviews: string;
  sessions: string;
  duration: number;
  stayed: number;
  goals_at: (string | null)[];
  country: string;
  device: string;
  browser: string;
  os: string;
  total: string;
};

@Injectable()
export class WebAnalyticsDayReadService {
  constructor(
    private readonly clickhouse: ClickHouseClient,
    private readonly read: WebAnalyticsReadService,
  ) {}

  public async readDays(
    clusterId: string,
    query: ReadWebAnalyticsDaysQuery,
    retentionDays: number,
  ): Promise<WebAnalyticsDaysResponse> {
    const now = new Date();
    const today = localDate(now, query.tz);
    const first = firstRetainedDay(query.tz, retentionDays);
    const requested = this.pastDay(query.date ?? today, today);
    const date = requested < first ? first : requested;
    const to = addDays(today, -Math.floor(daysBetween(date, today) / STRIP_DAYS) * STRIP_DAYS);
    const from = addDays(to, 1 - STRIP_DAYS);
    const dates = Array.from({ length: 2 * STRIP_DAYS }, (_, index) =>
      addDays(from, index - STRIP_DAYS),
    );
    const elapsed = secondOfDay(now, query.tz);
    const typicalDates =
      to === today ? TYPICAL_WEEKS.map((weeks) => addDays(today, -7 * weeks)) : [];
    const shown = dates.slice(STRIP_DAYS);
    const strip = this.visits(clusterId, query, shown, null, retentionDays);
    const [days, todayTypical, since, online, sources] = await Promise.all([
      this.readCounts(clusterId, query, dates, null, retentionDays),
      typicalDates.length
        ? this.readCounts(clusterId, query, typicalDates, elapsed, retentionDays)
        : [],
      this.readSince(clusterId, query.tz, retentionDays),
      this.read.readOnline([clusterId]),
      this.query<{ label: string; date: string; visits: string }>(
        `WITH visit AS (${strip.sql})
        SELECT source AS label, toString(day) AS date, count() AS visits FROM visit
        WHERE source IN (SELECT source FROM visit GROUP BY source ORDER BY count() DESC, source LIMIT ${GROUP_LIMIT})
        GROUP BY label, date`,
        strip.params,
      ),
    ]);
    return {
      today,
      elapsed,
      since,
      from,
      to,
      days,
      todayTypical,
      sources: [...new Set(sources.map((row) => row.label))].map((name) => ({
        name,
        visits: shown.map((date) =>
          Number(sources.find((row) => row.label === name && row.date === date)?.visits ?? 0),
        ),
      })),
      online: online[clusterId] ?? 0,
    };
  }

  public async readDay(
    clusterId: string,
    day: string,
    query: ReadWebAnalyticsDayQuery,
    retentionDays: number,
  ): Promise<WebAnalyticsDayResponse> {
    const now = new Date();
    const date = this.retainedDay(day, query.tz, retentionDays);
    const dates = [date, ...TYPICAL_WEEKS.map((weeks) => addDays(date, -7 * weeks))];
    const cutoff = date === localDate(now, query.tz) ? secondOfDay(now, query.tz) : null;
    const all = this.visits(clusterId, query, dates, null, retentionDays);
    const one = this.visits(clusterId, query, [date], null, retentionDays);
    const cut = cutoff === null ? all : this.visits(clusterId, query, dates, cutoff, retentionDays);
    const reached = this.reached(clusterId, query, [date], null, retentionDays);
    const [hours, goalHours, sourceHours, groups] = await Promise.all([
      this.query<{ date: string; hour: number; visits: string }>(
        `SELECT toString(day) AS date, toHour(started_at, {tz:String}) AS hour, count() AS visits
        FROM (${all.sql}) GROUP BY date, hour`,
        all.params,
      ),
      query.goal.length
        ? this.query<{ goal: number; hour: number; people: string }>(
            `SELECT goal, toHour(reached_at, {tz:String}) AS hour, count() AS people
            FROM (${reached.sql}) GROUP BY goal, hour`,
            reached.params,
          )
        : [],
      this.query<{ label: string; hour: number; visits: string }>(
        `WITH visit AS (${one.sql})
        SELECT source AS label, toHour(started_at, {tz:String}) AS hour, count() AS visits FROM visit
        WHERE source IN (SELECT source FROM visit GROUP BY source ORDER BY count() DESC, source LIMIT ${GROUP_LIMIT})
        GROUP BY label, hour`,
        one.params,
      ),
      this.readGroups(cut, date),
    ]);
    return {
      date,
      dates,
      cutoff,
      hours: dates.map((at) =>
        perHour(hours.filter((row) => row.date === at).map((row) => [row.hour, row.visits])),
      ),
      goalHours: query.goal.map((_, goal) =>
        perHour(goalHours.filter((row) => row.goal === goal).map((row) => [row.hour, row.people])),
      ),
      sourceHours: [...new Set(sourceHours.map((row) => row.label))].map(
        (name): WebAnalyticsSourceSeries => ({
          name,
          visits: perHour(
            sourceHours.filter((row) => row.label === name).map((row) => [row.hour, row.visits]),
          ),
        }),
      ),
      sources: this.toGroups(
        groups.filter((row) => row.kind === 'source'),
        dates,
      ),
      pages: this.toGroups(
        groups.filter((row) => row.kind === 'page'),
        dates,
      ),
    };
  }

  public async readDayVisits(
    clusterId: string,
    day: string,
    query: ReadWebAnalyticsDayVisitsQuery,
    retentionDays: number,
  ): Promise<WebAnalyticsDayVisitsResponse> {
    const date = this.retainedDay(day, query.tz, retentionDays);
    const visits = this.visits(clusterId, query, [date], null, retentionDays);
    const shown = {
      all: '1',
      stayed: 'stayed',
      goal: 'arrayExists(at -> at IS NOT NULL, goals_at)',
    }[query.show];
    const rows = await this.query<VisitRow>(
      `SELECT visitor, person, started_at, last_seen, source, entry_page, exit_page, pageviews,
        sessions, duration, stayed, goals_at, country, device, browser, os, count() OVER () AS total
      FROM (${visits.sql}) WHERE ${shown}
      ORDER BY started_at DESC, visitor LIMIT ${VISITS_PAGE} OFFSET {offset:UInt32}`,
      { ...visits.params, offset: query.offset },
    );
    return {
      visits: rows.map((row) => ({
        id: row.person || row.visitor,
        identified: row.person !== '',
        startedAt: toIso(row.started_at),
        lastSeenAt: toIso(row.last_seen),
        source: row.source,
        entryPage: row.entry_page,
        exitPage: row.exit_page,
        pageviews: Number(row.pageviews),
        sessions: Number(row.sessions),
        seconds: Math.round(row.duration),
        stayed: Number(row.stayed) === 1,
        goals: query.goal.map((_, goal) => {
          const at = row.goals_at[goal];
          return at ? toIso(at) : null;
        }),
        country: row.country,
        device: row.device,
        browser: row.browser,
        os: row.os,
      })),
      total: Number(rows[0]?.total ?? 0),
    };
  }

  public async readGoals(
    clusterId: string,
    tz: string,
    saved: string[],
  ): Promise<WebAnalyticsGoalsResponse> {
    const rows = await this.query<{ name: string; visits: string }>(
      `SELECT name, uniqExact(${VISIT}) AS visits
      FROM web_events FINAL
      WHERE cluster_id = {clusterId:FixedString(24)} AND expires_at > now()
        AND created_at >= {from:DateTime64(3)} AND name NOT IN ${NOT_A_GOAL}
      GROUP BY name ORDER BY visits DESC, name LIMIT 50`,
      {
        clusterId,
        tz,
        from: ClickhouseUtils.jsDateToClickhouseDate(new Date(Date.now() - STRIP_DAYS * DAY_MS)),
      },
    );
    const goals = rows.map((row) => ({ name: row.name, visits: Number(row.visits) }));
    return {
      goals: [
        ...goals,
        ...saved
          .filter((name) => !goals.some((goal) => goal.name === name))
          .map((name) => ({ name, visits: 0 })),
      ],
      picked: saved.length ? saved : goals.slice(0, 2).map((goal) => goal.name),
    };
  }

  private pastDay(date: string, today: string): string {
    if (date > today) throw new BadRequestException('Pick a day up to today');
    return date;
  }

  private retainedDay(date: string, tz: string, retentionDays: number): string {
    const day = this.pastDay(date, localDate(new Date(), tz));
    if (day < firstRetainedDay(tz, retentionDays))
      throw new BadRequestException(`Pick a day within the last ${retentionDays} days`);
    return day;
  }

  private async readCounts(
    clusterId: string,
    query: ReadWebAnalyticsDayQuery,
    dates: string[],
    cutoff: number | null,
    retentionDays: number,
  ): Promise<WebAnalyticsDayCounts[]> {
    const visits = this.visits(clusterId, query, dates, cutoff, retentionDays);
    const reached = this.reached(clusterId, query, dates, cutoff, retentionDays);
    const [rows, goals] = await Promise.all([
      this.query<CountsRow>(
        `SELECT toString(day) AS date, count() AS visits, countIf(stayed) AS stayed
        FROM (${visits.sql}) GROUP BY date`,
        visits.params,
      ),
      query.goal.length
        ? this.query<{ date: string; goal: number; people: string }>(
            `SELECT toString(day) AS date, goal, count() AS people
            FROM (${reached.sql}) GROUP BY date, goal`,
            reached.params,
          )
        : [],
    ]);
    return dates.map((date) => {
      const row = rows.find((entry) => entry.date === date);
      return {
        date,
        visits: Number(row?.visits ?? 0),
        stayed: Number(row?.stayed ?? 0),
        goals: query.goal.map((_, goal) =>
          Number(goals.find((entry) => entry.date === date && entry.goal === goal)?.people ?? 0),
        ),
      };
    });
  }

  private async readGroups(visits: Statement, date: string): Promise<GroupRow[]> {
    const entries = `ARRAY JOIN [('source', source), ('page', entry_page)] AS entry`;
    return this.query<GroupRow>(
      `WITH visit AS (${visits.sql})
      SELECT entry.1 AS kind, entry.2 AS label, toString(day) AS date, count() AS visits,
        countIf(stayed) AS stayed, quantileExact(0.5)(duration) AS median_seconds
      FROM visit ${entries}
      WHERE (kind, label) IN (
        SELECT top_kind, top_label FROM (
          SELECT entry.1 AS top_kind, entry.2 AS top_label, day = {date:Date} AS chosen,
            count() AS total
          FROM visit ${entries}
          GROUP BY top_kind, top_label, chosen
          ORDER BY total DESC, top_label LIMIT ${GROUP_LIMIT} BY top_kind, chosen
        )
      )
      GROUP BY kind, label, day`,
      { ...visits.params, date },
    );
  }

  private toGroups(rows: GroupRow[], dates: string[]): WebAnalyticsDayGroup[] {
    return [...new Set(rows.map((row) => row.label))].map((name) => ({
      name,
      days: dates.map((date) => {
        const row = rows.find((entry) => entry.label === name && entry.date === date);
        return {
          visits: Number(row?.visits ?? 0),
          stayed: Number(row?.stayed ?? 0),
          medianSeconds: Math.round(row?.median_seconds ?? 0),
        };
      }),
    }));
  }

  private async readSince(
    clusterId: string,
    tz: string,
    retentionDays: number,
  ): Promise<string | null> {
    const rows = await this.query<{ since: string | null }>(
      `SELECT toString(toDate(minOrNull(created_at), {tz:String})) AS since FROM web_events
      WHERE cluster_id = {clusterId:FixedString(24)} AND app = '' AND name = 'pageview'
        AND expires_at > now() AND created_at >= {from:DateTime64(3)}`,
      {
        clusterId,
        tz,
        from: ClickhouseUtils.jsDateToClickhouseDate(new Date(Date.now() - retentionDays * DAY_MS)),
      },
    );
    const first = rows[0]?.since;
    if (!first) return null;
    const retained = firstRetainedDay(tz, retentionDays);
    return first > retained ? first : retained;
  }

  // ponytail: each read rebuilds visits from raw events, scanning the 56 days of the strip at most; move to a visits table fed by a materialized view when that scan gets slow
  private visits(
    clusterId: string,
    query: ReadWebAnalyticsDayQuery,
    dates: string[],
    cutoff: number | null,
    retentionDays: number,
  ): Statement {
    const { events, filter, params } = this.window(clusterId, query, dates, cutoff, retentionDays);
    return {
      params: { ...params, goals: query.goal },
      sql: `SELECT session_visitor AS visitor, session_day AS day,
          min(session_start) AS started_at, max(session_end) AS last_seen,
          argMin(session_source, session_start) AS source,
          argMinIf(session_entry, session_start, session_pageviews > 0) AS entry_page,
          argMaxIf(session_exit, session_end, session_pageviews > 0) AS exit_page,
          sum(session_pageviews) AS pageviews, count() AS sessions,
          sum(session_seconds) AS duration,
          minForEach(session_goals) AS goals_at,
          pageviews > 1 OR sum(session_custom) > 0 OR duration >= 10 AS stayed,
          argMaxIf(session_user, session_end, session_user != '') AS person,
          anyIf(session_country, session_country != '') AS country,
          anyIf(session_device, session_device != '') AS device,
          anyIf(session_browser, session_browser != '') AS browser,
          anyIf(session_os, session_os != '') AS os
        FROM (
          SELECT any(visitor_id) AS session_visitor,
            toDate(min(created_at), {tz:String}) AS session_day,
            min(created_at) AS session_start, max(created_at) AS session_end,
            dateDiff('millisecond', session_start, session_end) / 1000 AS session_seconds,
            argMin(${SOURCE}, created_at) AS session_source,
            argMinIf(path, created_at, name = 'pageview') AS session_entry,
            argMaxIf(path, created_at, name = 'pageview') AS session_exit,
            countIf(name = 'pageview') AS session_pageviews,
            countIf(name NOT IN ${NOT_A_GOAL}) AS session_custom,
            minForEach(arrayMap(goal -> if(name = goal, created_at, NULL), {goals:Array(String)})) AS session_goals,
            argMaxIf(user_id, created_at, user_id != '') AS session_user,
            countIf(${filter}) AS session_matches,
            anyIf(country, country != '') AS session_country,
            anyIf(device, device != '') AS session_device,
            anyIf(browser, browser != '') AS session_browser,
            anyIf(os, os != '') AS session_os
          FROM web_events FINAL
          WHERE ${events} AND app = ''
          GROUP BY session_id
          HAVING session_day IN {days:Array(Date)}
        )
        GROUP BY visitor, day
        HAVING pageviews > 0 AND sum(session_matches) > 0`,
    };
  }

  private reached(
    clusterId: string,
    query: ReadWebAnalyticsDayQuery,
    dates: string[],
    cutoff: number | null,
    retentionDays: number,
  ): Statement {
    const { events, filter, params } = this.window(clusterId, query, dates, cutoff, retentionDays);
    return {
      params: { ...params, goals: query.goal },
      sql: `SELECT toDate(created_at, {tz:String}) AS day, toUInt8(indexOf({goals:Array(String)}, name) - 1) AS goal,
          ${PERSON} AS person, min(created_at) AS reached_at
        FROM web_events FINAL
        WHERE ${events} AND name IN {goals:Array(String)} AND day IN {days:Array(Date)} AND ${filter}
        GROUP BY day, goal, person`,
    };
  }

  private window(
    clusterId: string,
    query: ReadWebAnalyticsDayQuery,
    dates: string[],
    cutoff: number | null,
    retentionDays: number,
  ): Window {
    const sorted = [...dates].sort();
    const scope = this.read.scope(
      clusterId,
      {
        from: new Date(Date.parse(sorted[0]) - DAY_MS),
        to: new Date(Date.parse(sorted[sorted.length - 1]) + 2 * DAY_MS),
        granularity: WebAnalyticsGranularity.Day,
        tz: query.tz,
        filter: query.filter,
        compare: false,
      },
      retentionDays,
    );
    return {
      events: `cluster_id = {clusterId:FixedString(24)} AND expires_at > now()
        AND created_at >= {from:DateTime64(3)} AND created_at < {to:DateTime64(3)}${
          cutoff === null ? '' : ` AND ${SECOND_OF_DAY} < {cutoff:UInt32}`
        }`,
      filter: scope.filter,
      params: { ...scope.params, days: dates, ...(cutoff === null ? {} : { cutoff }) },
    };
  }

  private async query<T>(query: string, queryParams: Record<string, unknown>): Promise<T[]> {
    const result = await this.clickhouse.query({ query, query_params: queryParams });
    return (await result.json<T>()).data;
  }
}

function perHour(rows: [number, string][]): number[] {
  const hours = Array.from({ length: 24 }, () => 0);
  for (const [hour, visits] of rows) hours[hour] += Number(visits);
  return hours;
}

function toIso(date: string): string {
  return ClickhouseUtils.clickhouseDateToJsDate(date).toISOString();
}

function localDate(at: Date, tz: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(at);
}

function secondOfDay(at: Date, tz: string): number {
  const [hours, minutes, seconds] = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })
    .format(at)
    .split(':')
    .map(Number);
  return hours * 3600 + minutes * 60 + seconds;
}

function firstRetainedDay(tz: string, retentionDays: number): string {
  return addDays(localDate(new Date(Date.now() - retentionDays * DAY_MS), tz), 1);
}

function addDays(date: string, days: number): string {
  return new Date(Date.parse(date) + days * DAY_MS).toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS);
}
