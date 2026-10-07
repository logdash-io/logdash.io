import {
  allowedGranularities,
  analyticsWindow,
  defaultGranularity,
  isAnalyticsPeriod,
  type AnalyticsPeriod,
  type AnalyticsWindow,
} from './analytics-period';
import type {
  WebAnalyticsFilter,
  WebAnalyticsFilterDimension,
  WebAnalyticsFilterKey,
  WebAnalyticsGranularity,
  WebAnalyticsRange,
} from './web-analytics';

export interface AnalyticsQuery {
  period: AnalyticsPeriod;
  offset: number;
  granularity: WebAnalyticsGranularity;
  compare: boolean;
  filters: WebAnalyticsFilter[];
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
];

const GRANULARITIES: WebAnalyticsGranularity[] = [
  'hour',
  'day',
  'week',
  'month',
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
};

export function parseAnalyticsQuery(params: URLSearchParams): AnalyticsQuery {
  const rawPeriod = params.get('period');
  const period: AnalyticsPeriod = isAnalyticsPeriod(rawPeriod)
    ? rawPeriod
    : '7d';
  const offset = Math.min(
    0,
    Math.max(-500, Math.trunc(Number(params.get('offset')) || 0)),
  );
  const allowed = allowedGranularities(analyticsWindow(period, offset));
  const rawGranularity = params.get('granularity') as WebAnalyticsGranularity;
  return {
    period,
    offset: period === 'all' ? 0 : offset,
    granularity: allowed.includes(rawGranularity)
      ? rawGranularity
      : fallbackGranularity(period, allowed),
    compare: params.get('compare') === '1',
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
  };
}

export function analyticsSearch(query: AnalyticsQuery): string {
  const params = new URLSearchParams();
  if (query.period !== '7d') params.set('period', query.period);
  if (query.offset) params.set('offset', String(query.offset));
  if (query.granularity !== defaultGranularity(query.period))
    params.set('granularity', query.granularity);
  if (query.compare) params.set('compare', '1');
  for (const filter of query.filters)
    params.append('filter', `${filter.dimension}:${filter.value}`);
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

export function analyticsRange(
  query: AnalyticsQuery,
  tz: string,
): WebAnalyticsRange {
  const { from, to } = queryWindow(query);
  return {
    from,
    to,
    granularity: query.granularity,
    tz,
    filters: query.filters,
    compare: query.compare,
  };
}

export function queryWindow(query: AnalyticsQuery): AnalyticsWindow {
  return analyticsWindow(query.period, query.offset);
}

export function isGranularity(value: string): value is WebAnalyticsGranularity {
  return GRANULARITIES.includes(value as WebAnalyticsGranularity);
}

function fallbackGranularity(
  period: AnalyticsPeriod,
  allowed: WebAnalyticsGranularity[],
): WebAnalyticsGranularity {
  const preferred = defaultGranularity(period);
  return allowed.includes(preferred) ? preferred : (allowed[0] ?? 'day');
}
