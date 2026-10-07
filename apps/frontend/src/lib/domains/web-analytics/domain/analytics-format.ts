import { DateTime } from 'luxon';
import type {
  WebAnalyticsBreakdownName,
  WebAnalyticsFilterDimension,
  WebAnalyticsFilterKey,
  WebAnalyticsGranularity,
} from './web-analytics';

export const FILTER_BREAKDOWNS: Record<
  WebAnalyticsFilterDimension,
  WebAnalyticsBreakdownName
> = {
  channel: 'channels',
  referrer: 'referrers',
  campaign: 'campaigns',
  keyword: 'keywords',
  hostname: 'hostnames',
  page: 'pages',
  country: 'countries',
  browser: 'browsers',
  os: 'os',
  device: 'devices',
  goal: 'goals',
};

const COMPACT = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const COUNTRY_NAMES = new Intl.DisplayNames(['en'], { type: 'region' });

const ADJECTIVES = [
  'amber',
  'azure',
  'blue',
  'bronze',
  'coral',
  'crimson',
  'cyan',
  'golden',
  'green',
  'indigo',
  'ivory',
  'jade',
  'lavender',
  'lilac',
  'lime',
  'magenta',
  'maroon',
  'mint',
  'navy',
  'olive',
  'orange',
  'peach',
  'pink',
  'plum',
  'purple',
  'red',
  'rose',
  'ruby',
  'sage',
  'scarlet',
  'silver',
  'teal',
];

const ANIMALS = [
  'albatross',
  'badger',
  'beaver',
  'bison',
  'caracal',
  'cheetah',
  'crane',
  'dolphin',
  'falcon',
  'felidae',
  'ferret',
  'finch',
  'gazelle',
  'heron',
  'ibis',
  'jaguar',
  'kestrel',
  'koala',
  'lemur',
  'lynx',
  'marten',
  'meadowlark',
  'narwhal',
  'ocelot',
  'otter',
  'panda',
  'puffin',
  'quokka',
  'raven',
  'salamander',
  'tapir',
  'xerinae',
];

export function formatCount(value: number): string {
  return value < 10_000
    ? value.toLocaleString('en', { maximumFractionDigits: 1 })
    : COMPACT.format(value);
}

export function formatPercent(value: number): string {
  return `${value < 10 && value > 0 ? value.toFixed(1) : Math.round(value)}%`;
}

export function formatDuration(seconds: number): string {
  const total = Math.round(seconds);
  if (total < 60) return `${total}s`;
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (hours) return `${hours}h ${minutes}m`;
  return `${minutes}m ${total % 60}s`;
}

export function changePercent(
  current: number,
  previous: number,
): number | null {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}

export function countryName(code: string): string {
  try {
    return COUNTRY_NAMES.of(code) ?? code;
  } catch {
    return code;
  }
}

export function filterValueLabel(
  dimension: WebAnalyticsFilterKey,
  value: string,
): string {
  return dimension === 'country' ? countryName(value) : value;
}

export function countryFlag(code: string): string {
  if (!/^[A-Z]{2}$/.test(code)) return '';
  return String.fromCodePoint(
    ...[...code].map((letter) => 0x1f1e6 + letter.charCodeAt(0) - 65),
  );
}

export function visitorName(id: string): string {
  const seed = parseInt(id.slice(0, 8), 16) || 0;
  const words = ADJECTIVES.length * ANIMALS.length;
  return `${ADJECTIVES[seed % ADJECTIVES.length]} ${ANIMALS[Math.floor(seed / ADJECTIVES.length) % ANIMALS.length]} ${100 + (Math.floor(seed / words) % 900)}`;
}

export function visitorHue(id: string): number {
  return (parseInt(id.slice(8, 12), 16) || 0) % 360;
}

export function bucketLabel(
  time: number,
  granularity: WebAnalyticsGranularity,
): string {
  const date = DateTime.fromMillis(time);
  if (granularity === 'hour') return date.toFormat('ha').toLowerCase();
  if (granularity === 'month') return date.toFormat('LLL yyyy');
  return date.toFormat('d LLL');
}

export function bucketTitle(
  time: number,
  granularity: WebAnalyticsGranularity,
): string {
  const date = DateTime.fromMillis(time);
  if (granularity === 'hour') return date.toFormat('EEE d LLL, HH:mm');
  if (granularity === 'week') return `Week of ${date.toFormat('d LLL yyyy')}`;
  if (granularity === 'month') return date.toFormat('LLLL yyyy');
  return date.toFormat('EEEE, d LLL yyyy');
}

export function relativeDay(iso: string): string {
  const date = DateTime.fromISO(iso);
  const days = daysAgo(date);
  const time = date.toFormat('h:mm a');
  if (days === 0) return `Today at ${time}`;
  if (days === 1) return `Yesterday at ${time}`;
  return date.toFormat("d LLL 'at' h:mm a");
}

export function shortDay(iso: string): string {
  const date = DateTime.fromISO(iso);
  const days = daysAgo(date);
  if (days === 0) return date.toFormat('h:mm a');
  if (days === 1) return 'Yesterday';
  return date.toFormat('d LLL');
}

function daysAgo(date: DateTime): number {
  return Math.floor(
    DateTime.local().startOf('day').diff(date.startOf('day'), 'days').days,
  );
}
