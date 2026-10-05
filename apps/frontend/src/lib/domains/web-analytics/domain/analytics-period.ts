import { DateTime } from 'luxon';
import type { WebAnalyticsGranularity } from './web-analytics';

export type AnalyticsPeriod =
  | 'today'
  | 'yesterday'
  | '24h'
  | '7d'
  | '30d'
  | '12m'
  | 'wtd'
  | 'mtd'
  | 'ytd'
  | 'all';

export const ANALYTICS_PERIODS: { id: AnalyticsPeriod; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: '24h', label: 'Last 24 hours' },
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: '12m', label: 'Last 12 months' },
  { id: 'wtd', label: 'Week to date' },
  { id: 'mtd', label: 'Month to date' },
  { id: 'ytd', label: 'Year to date' },
  { id: 'all', label: 'All time' },
];

export const GRANULARITIES: { id: WebAnalyticsGranularity; label: string }[] = [
  { id: 'hour', label: 'Hourly' },
  { id: 'day', label: 'Daily' },
  { id: 'week', label: 'Weekly' },
  { id: 'month', label: 'Monthly' },
];

const DEFAULT_GRANULARITY: Record<AnalyticsPeriod, WebAnalyticsGranularity> = {
  today: 'hour',
  yesterday: 'hour',
  '24h': 'hour',
  '7d': 'day',
  '30d': 'day',
  '12m': 'month',
  wtd: 'day',
  mtd: 'day',
  ytd: 'month',
  all: 'week',
};

const MAX_BUCKETS: Record<WebAnalyticsGranularity, number> = {
  hour: 24 * 31,
  day: 400,
  week: Infinity,
  month: Infinity,
};

export interface AnalyticsWindow {
  from: Date;
  to: Date;
  label: string;
  canGoForward: boolean;
}

export function isAnalyticsPeriod(
  value: string | null,
): value is AnalyticsPeriod {
  return ANALYTICS_PERIODS.some((period) => period.id === value);
}

export function defaultGranularity(
  period: AnalyticsPeriod,
): WebAnalyticsGranularity {
  return DEFAULT_GRANULARITY[period];
}

export function allowedGranularities(
  window: Pick<AnalyticsWindow, 'from' | 'to'>,
): WebAnalyticsGranularity[] {
  const hours = (window.to.getTime() - window.from.getTime()) / 3_600_000;
  return GRANULARITIES.map((entry) => entry.id).filter((granularity) => {
    const size = { hour: 1, day: 24, week: 168, month: 720 }[granularity];
    return hours / size <= MAX_BUCKETS[granularity] && hours >= size;
  });
}

export function analyticsWindow(
  period: AnalyticsPeriod,
  offset: number,
  now: DateTime = DateTime.local(),
  retentionDays = 365,
): AnalyticsWindow {
  const day = now.startOf('day');
  const shifted = (
    from: DateTime,
    unit: 'days' | 'weeks' | 'months' | 'years',
    size = 1,
    toDate = false,
  ): AnalyticsWindow => {
    const start = from.plus({ [unit]: offset * size });
    const end = start.plus({ [unit]: size });
    const to = offset === 0 && toDate ? now : end;
    return {
      from: start.toJSDate(),
      to: to.toJSDate(),
      label:
        offset === 0
          ? labelOf(period)
          : rangeLabel(
              start,
              toDate ? end.minus({ days: 1 }) : end.minus({ milliseconds: 1 }),
              unit,
            ),
      canGoForward: offset < 0,
    };
  };
  if (period === 'today') return shifted(day, 'days');
  if (period === 'yesterday')
    return {
      ...shifted(day.minus({ days: 1 }), 'days'),
      label:
        offset === 0
          ? 'Yesterday'
          : rangeLabel(
              day.plus({ days: offset - 1 }),
              day.plus({ days: offset - 1 }),
              'days',
            ),
    };
  if (period === '24h') {
    const to = now.plus({ hours: 24 * offset });
    return {
      from: to.minus({ hours: 24 }).toJSDate(),
      to: to.toJSDate(),
      label:
        offset === 0
          ? 'Last 24 hours'
          : `${to.minus({ hours: 24 }).toFormat('d LLL, HH:mm')} – ${to.toFormat('d LLL, HH:mm')}`,
      canGoForward: offset < 0,
    };
  }
  if (period === '7d') return shifted(day.minus({ days: 6 }), 'days', 7);
  if (period === '30d') return shifted(day.minus({ days: 29 }), 'days', 30);
  if (period === '12m')
    return shifted(now.startOf('month').minus({ months: 11 }), 'months', 12);
  if (period === 'wtd') return shifted(now.startOf('week'), 'weeks', 1, true);
  if (period === 'mtd') return shifted(now.startOf('month'), 'months', 1, true);
  if (period === 'ytd') return shifted(now.startOf('year'), 'years', 1, true);
  return {
    from: day.minus({ days: retentionDays }).toJSDate(),
    to: now.toJSDate(),
    label: 'All time',
    canGoForward: false,
  };
}

function labelOf(period: AnalyticsPeriod): string {
  return ANALYTICS_PERIODS.find((entry) => entry.id === period)?.label ?? '';
}

function rangeLabel(
  start: DateTime,
  end: DateTime,
  unit: 'days' | 'weeks' | 'months' | 'years',
): string {
  if (unit === 'years') return start.toFormat('yyyy');
  if (unit === 'months' && start.hasSame(end, 'month'))
    return start.toFormat('LLLL yyyy');
  if (unit === 'months')
    return `${start.toFormat('LLL yyyy')} – ${end.toFormat('LLL yyyy')}`;
  if (start.hasSame(end, 'day')) return start.toFormat('EEE, d LLL');
  return start.hasSame(end, 'year')
    ? `${start.toFormat('d LLL')} – ${end.toFormat('d LLL')}`
    : `${start.toFormat('d LLL yyyy')} – ${end.toFormat('d LLL yyyy')}`;
}

export function endsInProgress(to: string, now = Date.now()): boolean {
  return Date.parse(to) >= now - 5 * 60_000;
}
