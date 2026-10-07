<script lang="ts">
  import {
    changePercent,
    formatCount,
    formatPercent,
  } from '../../domain/analytics-format';
  import { endsInProgress } from '../../domain/analytics-period';
  import type { AnalyticsQuery } from '../../domain/analytics-query';
  import type {
    AnalyticsChartLine,
    WebAnalyticsEvent,
    WebAnalyticsEventSummary,
  } from '../../domain/web-analytics';
  import AnalyticsChart from '../AnalyticsChart.svelte';

  type Props = {
    name: string;
    event: WebAnalyticsEvent | null;
    query: AnalyticsQuery;
    loading: boolean;
  };

  type Stat = {
    key: keyof WebAnalyticsEventSummary;
    label: string;
    format: (value: number) => string;
  };

  const { name, event, query, loading }: Props = $props();

  const STATS: Stat[] = [
    { key: 'count', label: 'Completions', format: formatCount },
    { key: 'visitors', label: 'Visitors', format: formatCount },
    { key: 'conversionRate', label: 'Conversion rate', format: formatPercent },
  ];

  const lines = $derived.by((): AnalyticsChartLine[] => {
    if (!event) return [];
    return [
      {
        label: 'Completions',
        values: event.series.map((point) => point.count),
        color: 'var(--fg-default)',
        area: true,
      },
      ...(query.compare && event.previousSeries
        ? [
            {
              label: 'Previous period',
              values: event.previousSeries
                .slice(0, event.series.length)
                .map((point) => point.count),
              color: 'var(--fg-faint)',
              dashed: true,
            },
          ]
        : []),
    ];
  });
</script>

<section aria-label="{name} overview">
  <div
    class="bg-surface-25-bg rounded-2xl p-2 [--chart-surface:var(--surface-25-bg)]"
  >
    <dl class="grid grid-cols-3 gap-2">
      {#each STATS as stat (stat.key)}
        {@const value = event?.summary[stat.key] ?? 0}
        {@const change = event
          ? changePercent(value, event.previous[stat.key])
          : null}
        <div class="flex min-w-0 flex-col gap-1.5 rounded-lg p-3">
          <dt class="text-fg-muted truncate text-xs">{stat.label}</dt>
          <dd class="font-mono text-2xl tabular-nums">
            {#if loading}
              <span class="bg-surface-150-bg block h-8 w-16 rounded-md"></span>
            {:else}
              {stat.format(value)}
            {/if}
          </dd>
          <dd class="h-4 text-xs tabular-nums">
            {#if change !== null && !loading}
              <span
                class={[
                  Math.round(change) === 0
                    ? 'text-fg-muted'
                    : change > 0
                      ? 'text-success'
                      : 'text-error',
                ]}
                title="Compared with the previous period"
              >
                {Math.round(change) === 0 ? '' : change > 0 ? '↑' : '↓'}
                {Math.abs(Math.round(change))}%
              </span>
            {/if}
          </dd>
        </div>
      {/each}
    </dl>

    <div class="pt-4 pb-1.5 pl-3">
      {#if event}
        <AnalyticsChart
          times={event.series.map((point) => point.time)}
          {lines}
          granularity={event.granularity}
          partial={endsInProgress(event.to)}
          label="Completions of {name} per {event.granularity}"
        />
      {:else}
        <div class="bg-surface-150-bg h-55 rounded-xl"></div>
      {/if}
    </div>
  </div>
</section>
