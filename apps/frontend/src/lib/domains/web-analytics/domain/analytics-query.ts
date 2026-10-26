import { DateTime } from 'luxon';
import type {
  WebAnalyticsFilter,
  WebAnalyticsFilterDimension,
  WebAnalyticsFilterKey,
  WebAnalyticsRange,
} from './web-analytics';

export interface AnalyticsQuery {
  day: string | null;
  filters: WebAnalyticsFilter[];
  event: string | null;
}

const DIMENSIONS: WebAnalyticsFilterDimension[] = [
  'channel',
  'referrer',
  'campaign',
  'keyword',
  'hostname',
  'page',
  'country',
  'browser',
  'os',
  'device',
  'goal',
  'app',
];

export const FILTER_LABELS: Record<WebAnalyticsFilterDimension, string> = {
  channel: 'Channel',
  referrer: 'Referrer',
  campaign: 'Campaign',
  keyword: 'Keyword',
  hostname: 'Hostname',
  page: 'Page',
  country: 'Country',
  browser: 'Browser',
  os: 'OS',
  device: 'Device',
  goal: 'Goal',
  app: 'App',
};

export function parseAnalyticsQuery(params: URLSearchParams): AnalyticsQuery {
  const day = params.get('day');
  const event = params.get('event');
  return {
    day: day && isLocalDate(day) ? day : null,
    filters: params
      .getAll('filter')
      .map((entry) => {
        const separator = entry.indexOf(':');
        return {
          dimension: entry.slice(0, separator) as WebAnalyticsFilterKey,
          value: entry.slice(separator + 1),
        };
      })
      .filter(
        (filter, index, all) =>
          (DIMENSIONS.includes(
            filter.dimension as WebAnalyticsFilterDimension,
          ) ||
            /^prop\.[a-z][a-z0-9_]{0,39}$/.test(filter.dimension)) &&
          filter.value.length > 0 &&
          all.findIndex((other) => other.dimension === filter.dimension) ===
            index,
      ),
    event: event && /^[a-z][a-z0-9_]{0,63}$/.test(event) ? event : null,
  };
}

export function analyticsSearch(query: AnalyticsQuery): string {
  const params = new URLSearchParams();
  if (query.day) params.set('day', query.day);
  for (const filter of query.filters)
    params.append('filter', `${filter.dimension}:${filter.value}`);
  if (query.event) params.set('event', query.event);
  const search = params.toString();
  return search ? `?${search}` : '';
}

export function withFilter(
  query: AnalyticsQuery,
  filter: WebAnalyticsFilter,
): AnalyticsQuery {
  return {
    ...query,
    filters: [
      ...query.filters.filter((entry) => entry.dimension !== filter.dimension),
      filter,
    ],
  };
}

export function filterLabel(dimension: WebAnalyticsFilterKey): string {
  return dimension.startsWith('prop.')
    ? dimension.slice(5)
    : FILTER_LABELS[dimension as WebAnalyticsFilterDimension];
}

export function dayRange(
  day: string,
  tz: string,
  filters: WebAnalyticsFilter[],
): WebAnalyticsRange {
  const start = DateTime.fromISO(day, { zone: tz }).startOf('day');
  return {
    from: start.toJSDate(),
    to: start.plus({ days: 1 }).toJSDate(),
    granularity: 'hour',
    tz,
    filters,
    compare: false,
  };
}

export function isLocalDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && DateTime.fromISO(value).isValid;
}
