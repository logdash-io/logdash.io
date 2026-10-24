<script lang="ts">
  import FilterIcon from '$lib/domains/shared/icons/FilterIcon.svelte';
  import XIcon from '$lib/domains/shared/icons/XIcon.svelte';
  import IconButton from '$lib/domains/shared/ui/components/IconButton.svelte';
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
  import StatTile from '../StatTile.svelte';

  type Props = {
    name: string;
    event: WebAnalyticsEvent | null;
    query: AnalyticsQuery;
    loading: boolean;
    onfilter?: () => void;
    onclose: () => void;
  };

  type Metric = 'count' | 'visitors' | 'people';

  type Stat = {
    label: string;
    value: (summary: WebAnalyticsEventSummary) => number;
    format: (value: number) => string;
    hint?: string;
    chart?: Metric;
  };

  const { name, event, query, loading, onfilter, onclose }: Props = $props();

  const stats = $derived<Stat[]>([
    {
      label: 'Completions',
      value: (summary: WebAnalyticsEventSummary) => summary.count,
      format: formatCount,
      chart: 'count',
    },
    {
      label: 'Visitors',
      value: (summary: WebAnalyticsEventSummary) => summary.visitors,
      format: formatCount,
      chart: 'visitors',
    },
    {
      label: 'Per visitor',
      value: (summary: WebAnalyticsEventSummary) =>
        summary.visitors ? summary.count / summary.visitors : 0,
      format: formatCount,
      hint: `Average completions of ${name} per visitor that sent it.`,
    },
    {
      label: 'People',
      value: (summary: WebAnalyticsEventSummary) => summary.people,
      format: formatCount,
      hint: `Signed-in people who sent ${name}, each counted once.`,
      chart: 'people',
    },
    {
      label: 'Conversion rate',
      value: (summary: WebAnalyticsEventSummary) => summary.conversionRate,
      format: formatPercent,
    },
  ]);

  let metric = $state<Metric>('count');

  const metricLabel = $derived(
    stats.find((stat) => stat.chart === metric)?.label ?? '',
  );
  const lines = $derived.by((): AnalyticsChartLine[] => {
    if (!event) return [];
    return [
      {
        label: metricLabel,
        values: event.series.map((point) => point[metric]),
        color: 'var(--fg-default)',
        area: true,
      },
      ...(query.compare && event.previousSeries
        ? [
            {
              label: 'Previous period',
              values: event.previousSeries
                .slice(0, event.series.length)
                .map((point) => point[metric]),
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
    <header class="flex h-7 items-center justify-between gap-3 pl-3">
      <h2 class="flex min-w-0 items-center gap-2 text-[13px]">
        <span class="text-fg-muted">Goal</span>
        <span class="truncate font-mono font-medium">{name}</span>
      </h2>
      <div class="flex shrink-0 items-center gap-1">
        {#if onfilter}
          <IconButton
            well
            label="Filter by visitors who sent {name}"
            tooltip="Filter by visitors who sent it"
            onclick={onfilter}
          >
            <FilterIcon class="size-3.5" />
          </IconButton>
        {/if}
        <IconButton
          well
          label="Close {name}"
          tooltip="Back to traffic"
          onclick={onclose}
        >
          <XIcon class="size-3.5" />
        </IconButton>
      </div>
    </header>

    <dl class="grid grid-cols-2 gap-2 @2xl:grid-cols-5">
      {#each stats as stat (stat.label)}
        {@const value = event ? stat.value(event.summary) : 0}
        <StatTile
          label={stat.label}
          hint={stat.hint}
          value={stat.format(value)}
          change={event
            ? changePercent(value, stat.value(event.previous))
            : null}
          {loading}
          selected={!!stat.chart && metric === stat.chart}
          onselect={stat.chart ? () => (metric = stat.chart!) : undefined}
        />
      {/each}
    </dl>

    <div class="pt-4 pb-1.5 pl-3">
      {#if event}
        <AnalyticsChart
          times={event.series.map((point) => point.time)}
          {lines}
          granularity={event.granularity}
          partial={endsInProgress(event.to)}
          label="{metricLabel} of {name} per {event.granularity}"
        />
      {:else}
        <div class="bg-surface-150-bg h-55 rounded-xl"></div>
      {/if}
    </div>
  </div>
</section>
