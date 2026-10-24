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
  import StatTile from './StatTile.svelte';

  type Props = {
    report: WebAnalyticsReport | null;
    query: AnalyticsQuery;
    loading: boolean;
  };

  type Metric = 'visitors' | 'people' | 'pageviews';

  type Stat = {
    key: keyof WebAnalyticsSummary;
    label: string;
    format: (value: number) => string;
    hint?: string;
    lowerIsBetter?: boolean;
    chart?: Metric;
  };

  const { report, query, loading }: Props = $props();

  const stats: Stat[] = [
    {
      key: 'visitors',
      label: 'Visitors',
      hint: 'Anonymous visitors get a new ID every Monday at 00:00 UTC, so someone who comes back in a later week counts again.',
      format: formatCount,
      chart: 'visitors',
    },
    {
      key: 'people',
      label: 'People',
      hint: 'Signed-in people, each counted once however often they come back. Call identify after sign-in, or pass userId to track in your apps, to count them.',
      format: formatCount,
      chart: 'people',
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

  let metric = $state<Metric>('visitors');

  const metricLabel = $derived(
    stats.find((stat) => stat.chart === metric)?.label ?? '',
  );
  const partial = $derived(report ? endsInProgress(report.to) : false);
  const lines = $derived.by((): AnalyticsChartLine[] => {
    if (!report) return [];
    return [
      {
        label: metricLabel,
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

  function isEmpty(stat: Stat): boolean {
    return (
      !report?.summary.visitors &&
      stat.key !== 'visitors' &&
      stat.key !== 'pageviews'
    );
  }
</script>

<section aria-label="Traffic overview">
  <div
    class="bg-surface-25-bg rounded-2xl p-2 [--chart-surface:var(--surface-25-bg)]"
  >
    <dl class="grid grid-cols-2 gap-2 @md:grid-cols-3 @3xl:grid-cols-6">
      {#each stats as stat (stat.key)}
        {@const value = report?.summary[stat.key] ?? 0}
        {@const empty = isEmpty(stat)}
        <StatTile
          label={stat.label}
          hint={stat.hint}
          value={empty ? '–' : stat.format(value)}
          change={report && !empty
            ? changePercent(value, report.previous[stat.key])
            : null}
          lowerIsBetter={stat.lowerIsBetter}
          {loading}
          selected={!!stat.chart && metric === stat.chart}
          onselect={stat.chart ? () => (metric = stat.chart!) : undefined}
        />
      {/each}
    </dl>

    <div class="pt-4 pb-1.5 pl-3">
      {#if report}
        <AnalyticsChart
          times={report.series.map((point) => point.time)}
          {lines}
          granularity={report.granularity}
          {partial}
          label="{metricLabel} per {report.granularity}"
        />
      {:else}
        <div class="bg-surface-150-bg h-55 rounded-xl"></div>
      {/if}
    </div>
  </div>
</section>
