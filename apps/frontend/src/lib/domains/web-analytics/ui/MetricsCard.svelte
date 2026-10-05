<script lang="ts">
  import {
    changePercent,
    formatCount,
    formatDuration,
    formatPercent,
  } from '../domain/analytics-format';
  import { endsInProgress } from '../domain/analytics-period';
  import type { AnalyticsQuery } from '../domain/analytics-query';
  import type {
    AnalyticsChartLine,
    WebAnalyticsReport,
    WebAnalyticsSummary,
  } from '../domain/web-analytics';
  import AnalyticsChart from './AnalyticsChart.svelte';

  type Props = {
    report: WebAnalyticsReport | null;
    query: AnalyticsQuery;
    loading: boolean;
  };

  type Stat = {
    key: keyof WebAnalyticsSummary;
    label: string;
    format: (value: number) => string;
    lowerIsBetter?: boolean;
    chart?: 'visitors' | 'pageviews';
  };

  const { report, query, loading }: Props = $props();

  const STATS: Stat[] = [
    {
      key: 'visitors',
      label: 'Visitors',
      format: formatCount,
      chart: 'visitors',
    },
    {
      key: 'pageviews',
      label: 'Pageviews',
      format: formatCount,
      chart: 'pageviews',
    },
    { key: 'conversionRate', label: 'Conversion rate', format: formatPercent },
    {
      key: 'bounceRate',
      label: 'Bounce rate',
      format: formatPercent,
      lowerIsBetter: true,
    },
    { key: 'sessionSeconds', label: 'Session time', format: formatDuration },
  ];

  let metric = $state<'visitors' | 'pageviews'>('visitors');

  const partial = $derived(report ? endsInProgress(report.to) : false);
  const lines = $derived.by((): AnalyticsChartLine[] => {
    if (!report) return [];
    const label = metric === 'visitors' ? 'Visitors' : 'Pageviews';
    return [
      {
        label,
        values: report.series.map((point) => point[metric]),
        color: 'var(--fg-default)',
        area: true,
      },
      ...(query.compare && report.previousSeries
        ? [
            {
              label: 'Previous period',
              values: report.previousSeries
                .slice(0, report.series.length)
                .map((point) => point[metric]),
              color: 'var(--fg-faint)',
              dashed: true,
            },
          ]
        : []),
    ];
  });
</script>

<section aria-label="Traffic overview">
  <div
    class="bg-surface-25-bg rounded-2xl p-2 [--chart-surface:var(--surface-25-bg)]"
  >
    <dl class="grid grid-cols-2 gap-2 @md:grid-cols-6 @2xl:grid-cols-5">
      {#each STATS as stat, index (stat.key)}
        {@const value = report?.summary[stat.key] ?? 0}
        {@const empty =
          !report?.summary.visitors &&
          stat.key !== 'visitors' &&
          stat.key !== 'pageviews'}
        {@const change = report
          ? changePercent(value, report.previous[stat.key])
          : null}
        <div
          class={[
            'relative flex min-w-0 flex-col gap-1.5 rounded-lg p-3 @2xl:col-span-1',
            stat.chart && metric === stat.chart
              ? 'bg-surface-25-selected-bg'
              : { 'hover:bg-surface-25-hover-bg': !!stat.chart },
            index < 3 ? '@md:col-span-2' : '@md:col-span-3',
            { 'col-span-2': index === STATS.length - 1 },
          ]}
        >
          <dt
            class={[
              'flex items-center text-xs',
              stat.chart && metric === stat.chart
                ? 'text-fg-default'
                : 'text-fg-muted',
            ]}
          >
            {#if stat.chart}
              <button
                type="button"
                class="focus-visible:outline-brand cursor-pointer text-left outline-none after:absolute after:inset-0 focus-visible:after:outline-2 focus-visible:after:-outline-offset-2"
                aria-pressed={metric === stat.chart}
                onclick={() => (metric = stat.chart!)}
              >
                {stat.label}
              </button>
            {:else}
              {stat.label}
            {/if}
          </dt>
          <dd class="font-mono text-2xl tabular-nums">
            {#if loading}
              <span class="bg-surface-150-bg block h-8 w-16 rounded-md"></span>
            {:else}
              {empty ? '–' : stat.format(value)}
            {/if}
          </dd>
          <dd class="h-4 text-xs tabular-nums">
            {#if change !== null && !loading && !empty}
              {@const better = stat.lowerIsBetter ? change < 0 : change > 0}
              <span
                class={[
                  Math.round(change) === 0
                    ? 'text-fg-muted'
                    : better
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
      {#if report}
        <AnalyticsChart
          times={report.series.map((point) => point.time)}
          {lines}
          granularity={report.granularity}
          {partial}
          label="{metric === 'visitors'
            ? 'Visitors'
            : 'Pageviews'} per {report.granularity}"
        />
      {:else}
        <div class="bg-surface-150-bg h-55 rounded-xl"></div>
      {/if}
    </div>
  </div>
</section>
