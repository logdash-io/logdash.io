<script lang="ts">
  import { Spinner } from '@logdash/hyper-ui/presentational';
  import { untrack } from 'svelte';
  import { WebAnalyticsInsightState } from '../../application/web-analytics-dashboard.state.svelte';
  import { formatPercent } from '../../domain/analytics-format';
  import { endsInProgress } from '../../domain/analytics-period';
  import type {
    WebAnalyticsChartConfig,
    WebAnalyticsInsightResult,
  } from '../../domain/web-analytics';
  import {
    defaultBucket,
    funnelRows,
    insightConfig,
    insightDraft,
    insightSummary,
  } from '../../domain/web-analytics-insight';
  import { WebAnalyticsService } from '../../infrastructure/web-analytics.service';
  import InsightCohorts from './InsightCohorts.svelte';
  import InsightFunnelColumns from './InsightFunnelColumns.svelte';
  import InsightFunnelRows from './InsightFunnelRows.svelte';
  import InsightHistogram from './InsightHistogram.svelte';
  import InsightTrend from './InsightTrend.svelte';

  type Props = {
    clusterId: string;
    chart: WebAnalyticsChartConfig;
    revision: number;
    summary?: string;
  };

  let { clusterId, chart, revision, summary = $bindable() }: Props = $props();

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const config = $derived(insightConfig(insightDraft(chart)));
  const key = $derived(JSON.stringify(config));
  const result = new WebAnalyticsInsightState<WebAnalyticsInsightResult>(() =>
    WebAnalyticsService.runInsight(clusterId, config, tz),
  );
  const endToEnd = $derived.by((): string | null => {
    const rows = funnelRows(result.data?.steps ?? []);
    return rows.length > 1
      ? `${formatPercent(rows[rows.length - 1].overall)} end to end`
      : null;
  });

  $effect(() => {
    summary = [insightSummary(config), endToEnd].filter(Boolean).join(', ');
  });

  $effect(() => {
    void key;
    void revision;
    untrack(() => void result.load());
  });
</script>

{#if result.error}
  <p class="text-error px-3 py-16 text-center text-sm" role="alert">
    {result.error}
  </p>
{:else if !result.data || result.data.type !== config.type}
  <div class="flex flex-1 items-center justify-center">
    <Spinner />
  </div>
{:else}
  {@const data = result.data}
  <div class="flex min-h-0 flex-1 flex-col gap-2">
    {#if config.type === 'funnel'}
      {@const Funnel =
        config.layout === 'rows' ? InsightFunnelRows : InsightFunnelColumns}
      <Funnel
        steps={data.steps ?? []}
        people={config.mode === 'people'}
        filters={(config.events ?? []).map((event) => event.filters)}
      />
    {:else if config.type === 'trend'}
      <InsightTrend
        times={data.times ?? []}
        series={data.series ?? []}
        events={config.events ?? []}
        bucket={data.bucket ?? defaultBucket('trend')}
        people={data.measure === 'people'}
        partial={endsInProgress(data.to)}
        label={config.title}
      />
    {:else if config.type === 'distribution'}
      <InsightHistogram
        bins={data.bins ?? []}
        summary={data.summary ?? { count: 0, mean: null, median: null }}
        binSize={config.binSize ?? 1}
      />
    {:else}
      <InsightCohorts
        cohorts={data.cohorts ?? []}
        events={config.events ?? []}
        bucket={config.bucket ?? defaultBucket('cohorts')}
        property={config.property ?? 'cohort'}
        lagDays={data.lagDays ?? []}
      />
    {/if}
  </div>
{/if}
