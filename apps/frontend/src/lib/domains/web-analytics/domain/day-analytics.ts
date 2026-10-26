import { DateTime } from 'luxon';
import { formatCount, formatPercent } from './analytics-format';
import type {
  WebAnalyticsDay,
  WebAnalyticsDayCounts,
  WebAnalyticsDayGroup,
  WebAnalyticsDays,
  WebAnalyticsDayVisit,
} from './web-analytics';

export type Flag = -1 | 0 | 1;

export interface DayCounts {
  visits: number;
  stayed: number;
  goals: number[];
}

export interface Typical {
  visits: number | null;
  visitsRange: [number, number] | null;
  stayRate: number | null;
  goals: (number | null)[];
  goalRanges: ([number, number] | null)[];
  baseline: number;
}

export interface CountVerdict {
  value: number;
  typical: number | null;
  flag: Flag;
}

export interface RateVerdict {
  hits: number;
  total: number;
  rate: number | null;
  interval: [number, number] | null;
  typical: number | null;
  baseline: number;
  flag: Flag;
}

export interface Verdict {
  visits: CountVerdict;
  stayed: RateVerdict;
  goals: CountVerdict[];
}

export interface StripDay {
  date: string;
  counts: DayCounts;
  typical: Typical;
  fullVisits: number | null;
  verdict: Verdict;
  inProgress: boolean;
  tracked: boolean;
}

export interface StripSummary {
  visits: number | null;
  stayRate: number | null;
  goals: (number | null)[];
  flagged: number;
}

export interface GroupRow {
  name: string;
  counts: DayCounts;
  medianSeconds: number;
  typical: Typical;
  verdict: Verdict;
}

export interface HeadlineInput {
  date: string;
  inProgress: boolean;
  time: string;
  verdict: Verdict;
  goals: string[];
  sources: GroupRow[];
  record: boolean;
}

export const MIN_BASELINE = 20;

const SHRINK = 100;

const WEEKS = [1, 2, 3, 4];

export function stripDays(data: WebAnalyticsDays, goals: number): StripDay[] {
  const tracked = (date: string): boolean =>
    data.since !== null && date >= data.since;
  const full = new Map(data.days.map((day) => [day.date, day]));
  const cut = new Map(data.todayTypical.map((day) => [day.date, day]));
  const samples = (
    date: string,
    source: Map<string, WebAnalyticsDayCounts>,
  ): DayCounts[] =>
    WEEKS.map((weeks) => addDays(date, -7 * weeks))
      .filter(tracked)
      .flatMap((at) => source.get(at) ?? []);
  return datesBetween(data.from, data.to).map((date) => {
    const counts = full.get(date) ?? emptyCounts(goals);
    const inProgress = date === data.today;
    const typical = typicalOf(samples(date, inProgress ? cut : full), goals);
    return {
      date,
      counts,
      typical,
      fullVisits: median(samples(date, full).map((sample) => sample.visits)),
      verdict: judge(counts, typical),
      inProgress,
      tracked: tracked(date),
    };
  });
}

export function stripSummary(days: StripDay[]): StripSummary {
  const complete = days.filter((day) => day.tracked && !day.inProgress);
  const visited = complete.filter((day) => day.counts.visits > 0);
  return {
    visits: mean(complete.map((day) => day.counts.visits)),
    stayRate: mean(visited.map((day) => day.counts.stayed / day.counts.visits)),
    goals: (days[0]?.counts.goals ?? []).map((_, goal) =>
      mean(complete.map((day) => day.counts.goals[goal])),
    ),
    flagged: days.filter(
      (day) =>
        day.verdict.visits.flag ||
        day.verdict.stayed.flag ||
        day.verdict.goals.some((goal) => goal.flag),
    ).length,
  };
}

export function isRecord(days: StripDay[], date: string): boolean {
  const others = days.filter((day) => day.date !== date);
  const day = days.find((entry) => entry.date === date);
  if (!day?.counts.visits || others.some((entry) => !entry.tracked))
    return false;
  return others.every((entry) => entry.counts.visits < day.counts.visits);
}

export function typicalHours(
  day: WebAnalyticsDay,
  since: string | null,
): number[] | null {
  const samples = day.hours.filter(
    (_, index) => index > 0 && since !== null && day.dates[index] >= since,
  );
  if (!samples.length) return null;
  const hours = Array.from(
    { length: 24 },
    (_, hour) => median(samples.map((sample) => sample[hour])) ?? 0,
  );
  return hours.map(
    (value, hour) =>
      (hours[Math.max(0, hour - 1)] +
        2 * value +
        hours[Math.min(23, hour + 1)]) /
      4,
  );
}

export function groupRows(
  groups: WebAnalyticsDayGroup[],
  dates: string[],
  since: string | null,
): GroupRow[] {
  return groups
    .map((group): GroupRow => {
      const [day, ...earlier] = group.days.map((entry) => ({
        ...entry,
        goals: [],
      }));
      const typical = typicalOf(
        earlier.filter(
          (_, index) => since !== null && dates[index + 1] >= since,
        ),
        0,
      );
      return {
        name: group.name,
        counts: day,
        medianSeconds: day.medianSeconds,
        typical,
        verdict: judge(day, typical),
      };
    })
    .filter((row) => row.counts.visits > 0 || (row.typical.visits ?? 0) >= 1)
    .sort(
      (a, b) =>
        b.counts.visits - a.counts.visits ||
        (b.typical.visits ?? 0) - (a.typical.visits ?? 0) ||
        a.name.localeCompare(b.name),
    );
}

export function dayHeadline(input: HeadlineInput): string {
  const { verdict, goals } = input;
  const weekday = DateTime.fromISO(input.date).toFormat('cccc');
  if (!verdict.visits.value && !verdict.goals.some((goal) => goal.value))
    return input.inProgress ? 'No visits yet today.' : 'No visits on this day.';
  const by = input.inProgress ? ` by ${input.time}` : '';
  const goalLine = (index: number, direction: Flag): string => {
    const goal = verdict.goals[index];
    if (!goal || !goals[index] || goal.flag !== direction) return '';
    return `${direction > 0 ? 'More' : 'Fewer'} people did ${goals[index]} than on a usual ${weekday}: ${formatCount(goal.value)}${by}, usually ${whole(goal.typical)}.`;
  };
  const others = verdict.goals.slice(1).map((_, index) => index + 1);
  const lines = [
    goalLine(0, -1),
    verdict.visits.flag > 0
      ? `Busier than a usual ${weekday}: ${formatCount(verdict.visits.value)} visits${by}, usually ${whole(verdict.visits.typical)}.${sourceLine(input.sources)}`
      : '',
    verdict.visits.flag < 0
      ? `Quieter than a usual ${weekday}: ${formatCount(verdict.visits.value)} visits${by}, usually ${whole(verdict.visits.typical)}.`
      : '',
    goalLine(0, 1),
    stayLine(verdict.stayed, -1),
    stayLine(verdict.stayed, 1),
    ...others.map((index) => goalLine(index, -1)),
    ...others.map((index) => goalLine(index, 1)),
    input.record ? 'The busiest day in 4 weeks.' : '',
  ].filter(Boolean);
  if (lines.length) return lines.slice(0, 2).join(' ');
  return input.inProgress
    ? `A normal ${weekday} so far.`
    : `A normal ${weekday}.`;
}

export function judge(counts: DayCounts, typical: Typical): Verdict {
  const rate = (hits: number, typicalRate: number | null): RateVerdict => ({
    hits,
    total: counts.visits,
    rate: counts.visits ? hits / counts.visits : null,
    interval: counts.visits ? wilson(hits, counts.visits) : null,
    typical: typicalRate,
    baseline: typical.baseline,
    flag: rateFlag(hits, counts.visits, typicalRate, typical.baseline),
  });
  return {
    visits: {
      value: counts.visits,
      typical: typical.visits,
      flag: countFlag(counts.visits, typical.visits),
    },
    stayed: rate(counts.stayed, typical.stayRate),
    goals: counts.goals.map((value, goal) => ({
      value,
      typical: typical.goals[goal] ?? null,
      flag: countFlag(value, typical.goals[goal] ?? null),
    })),
  };
}

export function typicalOf(samples: DayCounts[], goals: number): Typical {
  const goal = (index: number): number[] =>
    samples.map((sample) => sample.goals[index] ?? 0);
  return {
    visits: median(samples.map((sample) => sample.visits)),
    visitsRange: middleHalf(samples.map((sample) => sample.visits)),
    stayRate: typicalRate(samples, (sample) => sample.stayed),
    goals: Array.from({ length: goals }, (_, index) => median(goal(index))),
    goalRanges: Array.from({ length: goals }, (_, index) =>
      middleHalf(goal(index)),
    ),
    baseline: samples.reduce((sum, sample) => sum + sample.visits, 0),
  };
}

export function countFlag(value: number, typical: number | null): Flag {
  if (typical === null) return 0;
  const [low, high] = countBand(typical);
  if (value > high) return 1;
  return value < low ? -1 : 0;
}

export function countBand(typical: number): [number, number] {
  const half = 2 * Math.sqrt(Math.max(typical, 1));
  return [Math.max(0, typical - half), typical + half];
}

export function rateFlag(
  hits: number,
  total: number,
  typical: number | null,
  baseline: number,
): Flag {
  if (!total || typical === null || baseline < MIN_BASELINE) return 0;
  const [low, high] = wilson(hits, total);
  if (typical < low) return 1;
  return typical > high ? -1 : 0;
}

export function wilson(
  hits: number,
  total: number,
  z = 1.96,
): [number, number] {
  if (!total) return [0, 1];
  const rate = hits / total;
  const z2 = z * z;
  const denominator = 1 + z2 / total;
  const centre = (rate + z2 / (2 * total)) / denominator;
  const half =
    (z * Math.sqrt((rate * (1 - rate)) / total + z2 / (4 * total * total))) /
    denominator;
  return [Math.max(0, centre - half), Math.min(1, centre + half)];
}

export function median(values: number[]): number | null {
  return quantile(values, 0.5);
}

export function quantile(values: number[], q: number): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const at = (sorted.length - 1) * q;
  const low = Math.floor(at);
  const high = Math.min(low + 1, sorted.length - 1);
  return sorted[low] + (sorted[high] - sorted[low]) * (at - low);
}

export function verdictLabel(flag: Flag): string {
  if (flag > 0) return 'Above usual';
  return flag < 0 ? 'Below usual' : 'Normal';
}

export function formatRate(rate: number | null): string {
  return rate === null ? '-' : formatPercent(rate * 100);
}

export function formatInterval(interval: [number, number] | null): string {
  if (!interval) return '-';
  const [low, high] = interval.map((rate) =>
    formatPercent(rate * 100).replace('%', ''),
  );
  return `${low}-${high}%`;
}

export function whole(value: number | null): string {
  return value === null ? '-' : formatCount(Math.round(value));
}

export function visitKey(visit: WebAnalyticsDayVisit): string {
  return `${visit.id}:${visit.startedAt}`;
}

export function dayLabel(date: string, today: string): string {
  if (date === today) return 'Today';
  if (date === addDays(today, -1)) return 'Yesterday';
  const day = DateTime.fromISO(date);
  return day.toFormat(
    day.year === DateTime.fromISO(today).year ? 'ccc d LLL' : 'ccc d LLL yyyy',
  );
}

export function daysBetween(from: string, to: string): number {
  return Math.round(
    DateTime.fromISO(to, { zone: 'utc' })
      .diff(DateTime.fromISO(from, { zone: 'utc' }), 'days')
      .as('days'),
  );
}

export function addDays(date: string, days: number): string {
  return (
    DateTime.fromISO(date, { zone: 'utc' }).plus({ days }).toISODate() ?? date
  );
}

function stayLine(stayed: RateVerdict, direction: Flag): string {
  if (stayed.flag !== direction) return '';
  return `${direction > 0 ? 'More' : 'Fewer'} visits stayed than usual: ${formatRate(stayed.rate)}, usually ${formatRate(stayed.typical)}.`;
}

function sourceLine(sources: GroupRow[]): string {
  const busiest = sources
    .filter((row) => row.verdict.visits.flag > 0)
    .sort(
      (a, b) =>
        b.counts.visits -
        (b.typical.visits ?? 0) -
        (a.counts.visits - (a.typical.visits ?? 0)),
    )[0];
  if (!busiest) return '';
  const tail =
    busiest.medianSeconds < 10
      ? ', and most left within seconds'
      : busiest.verdict.stayed.flag < 0
        ? ', and fewer of them stayed'
        : '';
  return ` ${busiest.name} sent ${formatCount(busiest.counts.visits)}, usually ${whole(busiest.typical.visits)}${tail}.`;
}

function typicalRate(
  samples: DayCounts[],
  hits: (sample: DayCounts) => number,
): number | null {
  const visits = samples.reduce((sum, sample) => sum + sample.visits, 0);
  if (!visits) return null;
  const pooled =
    (samples.reduce((sum, sample) => sum + hits(sample), 0) + 1) / (visits + 2);
  return median(
    samples.map(
      (sample) => (hits(sample) + SHRINK * pooled) / (sample.visits + SHRINK),
    ),
  );
}

function middleHalf(values: number[]): [number, number] | null {
  const low = quantile(values, 0.25);
  const high = quantile(values, 0.75);
  return low === null || high === null ? null : [low, high];
}

function mean(values: number[]): number | null {
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : null;
}

function datesBetween(from: string, to: string): string[] {
  const dates: string[] = [];
  for (let date = from; date <= to; date = addDays(date, 1)) dates.push(date);
  return dates;
}

function emptyCounts(goals: number): DayCounts {
  return {
    visits: 0,
    stayed: 0,
    goals: Array.from({ length: goals }, () => 0),
  };
}
