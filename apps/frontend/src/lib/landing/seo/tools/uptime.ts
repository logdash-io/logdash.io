const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const YEAR_MS = 365.25 * DAY_MS;

export type Period = { label: string; noun: string; ms: number };

export const PERIODS: Period[] = [
  { label: 'Day', noun: 'day', ms: DAY_MS },
  { label: 'Week', noun: 'week', ms: 7 * DAY_MS },
  { label: 'Month', noun: 'month', ms: YEAR_MS / 12 },
  { label: 'Quarter', noun: 'quarter', ms: YEAR_MS / 4 },
  { label: 'Year', noun: 'year', ms: YEAR_MS },
];

const percentFormat = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 4,
});

const moneyFormat = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  trailingZeroDisplay: 'stripIfInteger',
});

export function parseAmount(input: string): number | null {
  return parseDecimal(input.replace(/[$,\s]/g, ''));
}

export function parsePercent(input: string): number | null {
  const value = parseDecimal(input.replace(/[%\s]/g, '').replace(',', '.'));

  return value !== null && value <= 100 ? value : null;
}

function parseDecimal(input: string): number | null {
  return /^(\d+\.?\d*|\.\d+)$/.test(input) ? Number(input) : null;
}

export function downtimeMs(percent: number, periodMs: number): number {
  return Math.round((periodMs * (100 - percent)) / 100);
}

export function compositePercent(percents: number[]): number {
  return percents.reduce((total, percent) => (total * percent) / 100, 100);
}

export function formatPercent(percent: number): string {
  return `${percentFormat.format(percent)}%`;
}

export function formatMoney(amount: number): string {
  return moneyFormat.format(amount);
}

export function formatDuration(ms: number): string {
  if (ms <= 0) {
    return '0s';
  }

  const days = Math.floor(ms / DAY_MS);
  const hours = Math.floor((ms % DAY_MS) / HOUR_MS);
  const minutes = Math.floor((ms % HOUR_MS) / MINUTE_MS);
  const seconds = (ms % MINUTE_MS) / SECOND_MS;

  return [
    days ? `${days}d` : '',
    hours ? `${hours}h` : '',
    minutes ? `${minutes}m` : '',
    seconds ? `${seconds}s` : '',
  ]
    .filter(Boolean)
    .join(' ');
}
