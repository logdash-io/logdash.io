import { match } from 'ts-pattern';

export type TimeRangeValue =
  | 'last-15m'
  | 'last-1h'
  | 'last-4h'
  | 'last-24h'
  | 'last-7d'
  | 'last-30d'
  | 'custom';

export type TimeRangePreset = {
  value: TimeRangeValue;
  label: string;
  hours: number;
};

export const TIME_RANGE_PRESETS: TimeRangePreset[] = [
  { value: 'last-15m', label: 'Last 15 minutes', hours: 0.25 },
  { value: 'last-1h', label: 'Last hour', hours: 1 },
  { value: 'last-4h', label: 'Last 4 hours', hours: 4 },
  { value: 'last-24h', label: 'Last 24 hours', hours: 24 },
  { value: 'last-7d', label: 'Last 7 days', hours: 168 },
  { value: 'last-30d', label: 'Last 30 days', hours: 720 },
  { value: 'custom', label: 'Custom', hours: 0 },
];

export function getDatesForTimeRange(rangeValue: TimeRangeValue): {
  startDate: string;
  endDate: string;
} {
  const now = new Date();
  const endDate = now.toISOString();

  const startDate = match(rangeValue)
    .with('last-15m', () => new Date(now.getTime() - 15 * 60 * 1000))
    .with('last-1h', () => new Date(now.getTime() - 60 * 60 * 1000))
    .with('last-4h', () => new Date(now.getTime() - 4 * 60 * 60 * 1000))
    .with('last-24h', () => new Date(now.getTime() - 24 * 60 * 60 * 1000))
    .with('last-7d', () => new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000))
    .with('last-30d', () => new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000))
    .with('custom', () => null)
    .exhaustive();

  return {
    startDate: startDate?.toISOString() ?? '',
    endDate,
  };
}

export function formatTimeRangeLabel(
  startDate: string | null,
  endDate: string | null,
): string | null {
  if (!startDate || !endDate) return null;

  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMinutes = Math.floor(
    (end.getTime() - start.getTime()) / (1000 * 60),
  );

  return match(diffMinutes)
    .with(15, () => 'Last 15 minutes')
    .with(60, () => 'Last hour')
    .with(240, () => 'Last 4 hours')
    .with(1440, () => 'Last 24 hours')
    .with(10080, () => 'Last 7 days')
    .with(43200, () => 'Last 30 days')
    .otherwise(() => formatCustomRange(start, end));
}

function formatCustomRange(start: Date, end: Date): string {
  const formatDate = (d: Date): string =>
    d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return `${formatDate(start)} - ${formatDate(end)}`;
}

export function isTimeRangeExceedingLimit(
  hours: number,
  maxHours: number,
): boolean {
  return hours > maxHours;
}

export function isCustomRangeExceedingLimit(
  startDate: string,
  endDate: string,
  maxHours: number,
): boolean {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  return diffHours > maxHours;
}
