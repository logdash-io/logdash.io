import { match } from 'ts-pattern';
import type {
  WebAnalyticsFunnelMode,
  WebAnalyticsInsight,
  WebAnalyticsInsightBucket,
  WebAnalyticsInsightConfig,
  WebAnalyticsInsightEvent,
  WebAnalyticsInsightFilter,
  WebAnalyticsInsightOperator,
  WebAnalyticsInsightStep,
  WebAnalyticsInsightType,
} from './web-analytics';

export interface WebAnalyticsInsightDraft {
  type: WebAnalyticsInsightType;
  title: string;
  days: number;
  mode: WebAnalyticsFunnelMode;
  steps: string[];
  events: WebAnalyticsInsightEvent[];
  filters: WebAnalyticsInsightFilter[];
  bucket: WebAnalyticsInsightBucket | null;
  property: string;
  binSize: number;
}

export interface WebAnalyticsFunnelRow {
  name: string;
  count: number;
  conversion: number | null;
  dropped: number | null;
  overall: number;
}

export const INSIGHT_TYPES: {
  value: WebAnalyticsInsightType;
  label: string;
}[] = [
  { value: 'funnel', label: 'Funnel' },
  { value: 'trend', label: 'Trend' },
  { value: 'distribution', label: 'Histogram' },
  { value: 'cohorts', label: 'Cohorts' },
];

export const INSIGHT_OPERATORS: {
  value: WebAnalyticsInsightOperator;
  label: string;
}[] = [
  { value: 'eq', label: '=' },
  { value: 'neq', label: '≠' },
  { value: 'gt', label: '>' },
  { value: 'gte', label: '≥' },
  { value: 'lt', label: '<' },
  { value: 'lte', label: '≤' },
];

export const INSIGHT_EVENT_LIMITS: Record<
  WebAnalyticsInsightType,
  { min: number; max: number }
> = {
  funnel: { min: 2, max: 8 },
  trend: { min: 1, max: 5 },
  distribution: { min: 1, max: 1 },
  cohorts: { min: 2, max: 8 },
};

export const INSIGHT_DAYS = [7, 14, 30, 90, 180, 365];

export function defaultBucket(
  type: WebAnalyticsInsightType,
): WebAnalyticsInsightBucket {
  return type === 'cohorts' ? 'week' : 'day';
}

export function insightDraft(
  insight?: WebAnalyticsInsightConfig,
): WebAnalyticsInsightDraft {
  const type = insight?.type ?? 'funnel';
  return {
    type,
    title: insight?.title ?? '',
    days: insight?.days ?? 30,
    mode: insight?.mode ?? 'events',
    steps: insight?.steps?.length ? [...insight.steps] : ['page:/', 'goal:'],
    events: withEventCount(
      (insight?.events ?? []).map((event) => ({
        name: event.name,
        filters: event.filters.map((filter) => ({ ...filter })),
      })),
      type,
    ),
    filters: (insight?.filters ?? []).map((filter) => ({ ...filter })),
    bucket: insight?.bucket ?? null,
    property: insight?.property ?? '',
    binSize: insight?.binSize ?? 1,
  };
}

export function withEventCount(
  events: WebAnalyticsInsightEvent[],
  type: WebAnalyticsInsightType,
): WebAnalyticsInsightEvent[] {
  const { min, max } = INSIGHT_EVENT_LIMITS[type];
  const padding = Array.from(
    { length: Math.max(0, min - events.length) },
    () => ({ name: '', filters: [] }),
  );
  return [...events, ...padding].slice(0, max);
}

export function insightConfig(
  draft: WebAnalyticsInsightDraft,
): WebAnalyticsInsightConfig {
  const base = {
    type: draft.type,
    title: draft.title.trim(),
    days: draft.days,
  };
  const events = draft.events.map((event) => ({
    name: event.name.trim(),
    filters: event.filters.map(trimFilter),
  }));
  const filters = draft.filters.map(trimFilter);
  const bucket = draft.bucket ?? defaultBucket(draft.type);
  return match(draft.type)
    .with('funnel', () =>
      draft.mode === 'people'
        ? {
            ...base,
            mode: draft.mode,
            steps: draft.steps.map((step) => step.trim()),
          }
        : { ...base, mode: draft.mode, events, filters },
    )
    .with('trend', () => ({ ...base, events, filters, bucket }))
    .with('distribution', () => ({
      ...base,
      events,
      filters,
      property: draft.property.trim(),
      binSize: draft.binSize,
    }))
    .with('cohorts', () => ({
      ...base,
      events,
      filters,
      bucket,
      property: draft.property.trim() || 'cohort',
    }))
    .exhaustive();
}

export function insightProblem(
  config: WebAnalyticsInsightConfig,
): string | null {
  if (!config.title) return 'Name the insight';
  if (config.mode === 'people') {
    const steps = config.steps ?? [];
    if (steps.length < 2) return 'Add at least two steps';
    if (steps.some((step) => !stepValue(step))) return 'Fill in every step';
    return null;
  }
  const events = config.events ?? [];
  const { min } = INSIGHT_EVENT_LIMITS[config.type];
  if (events.length < min) return `Add at least ${min} events`;
  if (events.some((event) => !event.name)) return 'Pick an event for each row';
  const filters = [
    ...(config.filters ?? []),
    ...events.flatMap((event) => event.filters),
  ];
  if (filters.some((filter) => !filter.key || !filter.value))
    return 'Fill in or remove each filter';
  if (config.type === 'distribution' && !config.property)
    return 'Pick a numeric property';
  if (config.type === 'distribution' && !((config.binSize ?? 0) > 0))
    return 'Set a bar width above 0';
  return null;
}

export function funnelRows(
  steps: WebAnalyticsInsightStep[],
): WebAnalyticsFunnelRow[] {
  const first = steps[0]?.count ?? 0;
  return steps.map((step, index) => {
    const previous = index ? steps[index - 1].count : null;
    return {
      name: step.name,
      count: step.count,
      conversion:
        previous === null ? null : previous ? (step.count / previous) * 100 : 0,
      dropped: previous === null ? null : Math.max(0, previous - step.count),
      overall: first ? (step.count / first) * 100 : 0,
    };
  });
}

export function commonPrefix(names: string[]): string {
  if (names.length < 2) return '';
  let prefix = names[0];
  for (const name of names)
    while (!name.startsWith(prefix)) prefix = prefix.slice(0, -1);
  const cut = prefix.lastIndexOf('_') + 1;
  return names.some((name) => name.length <= cut) ? '' : prefix.slice(0, cut);
}

export function stepKind(step: string): 'page' | 'goal' {
  return step.startsWith('goal:') ? 'goal' : 'page';
}

export function stepValue(step: string): string {
  return step.slice(step.indexOf(':') + 1).trim();
}

export function filterLabel(filter: WebAnalyticsInsightFilter): string {
  const operator =
    INSIGHT_OPERATORS.find((option) => option.value === filter.op)?.label ??
    filter.op;
  return `${filter.key} ${operator} ${filter.value}`;
}

export function insightSummary(insight: WebAnalyticsInsight): string {
  const period = `last ${insight.days} days`;
  const filters = [
    ...(insight.type === 'distribution'
      ? (insight.events?.[0]?.filters ?? [])
      : []),
    ...(insight.filters ?? []),
  ];
  const summary = match(insight.type)
    .with(
      'funnel',
      () =>
        `${insight.mode === 'people' ? 'People' : 'Events'} funnel, ${period}`,
    )
    .with('trend', () => `${bucketName(insight.bucket)}, ${period}`)
    .with('distribution', () => `${insight.property ?? ''}, ${period}`)
    .with(
      'cohorts',
      () =>
        `${bucketName(insight.bucket ?? 'week')} cohorts by ${insight.property ?? 'cohort'}, ${period}`,
    )
    .exhaustive();
  return [summary, ...filters.map(filterLabel)].join(', ');
}

function bucketName(bucket: WebAnalyticsInsightBucket | undefined): string {
  return match(bucket ?? 'day')
    .with('day', () => 'Daily')
    .with('week', () => 'Weekly')
    .with('month', () => 'Monthly')
    .exhaustive();
}

function trimFilter(
  filter: WebAnalyticsInsightFilter,
): WebAnalyticsInsightFilter {
  return { key: filter.key.trim(), op: filter.op, value: filter.value.trim() };
}
