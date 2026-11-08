<script lang="ts">
  import {
    MENU_PANEL,
    MENU_ROW,
    onMenuArrowKeys,
  } from '$lib/domains/app/clusters/ui/menu';
  import MoreIcon from '$lib/domains/shared/icons/MoreIcon.svelte';
  import Well from '$lib/domains/shared/ui/components/Well.svelte';
  import { Dropdown, Spinner } from '@logdash/hyper-ui/presentational';
  import { untrack } from 'svelte';
  import { WebAnalyticsInsightState } from '../../application/web-analytics-dashboard.state.svelte';
  import { formatPercent } from '../../domain/analytics-format';
  import { endsInProgress } from '../../domain/analytics-period';
  import type {
    WebAnalyticsInsight,
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
  import InsightFunnel from './InsightFunnel.svelte';
  import InsightHistogram from './InsightHistogram.svelte';
  import InsightTrend from './InsightTrend.svelte';

  type Props = {
    clusterId: string;
    insight: WebAnalyticsInsight;
    revision: number;
    first: boolean;
    last: boolean;
    onedit: (insight: WebAnalyticsInsight) => void;
    onmove: (insight: WebAnalyticsInsight, offset: number) => void;
    onremove: (insight: WebAnalyticsInsight) => void;
  };

  const {
    clusterId,
    insight,
    revision,
    first,
    last,
    onedit,
    onmove,
    onremove,
  }: Props = $props();

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const config = $derived(insightConfig(insightDraft(insight)));
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
  const summary = $derived(
    [insightSummary(insight), endToEnd].filter(Boolean).join(', '),
  );

  $effect(() => {
    void key;
    void revision;
    untrack(() => void result.load());
  });
</script>

<Well
  label={insight.title}
  class={[
    '@container',
    { '@4xl/insights:col-span-2': insight.type === 'cohorts' },
  ]}
>
  {#snippet header()}
    <h3 class="flex min-w-0 items-baseline gap-2 px-3 text-[13px]">
      <span class="max-w-full shrink-0 truncate font-medium">
        {insight.title}
      </span>
      <span class="text-fg-muted min-w-0 truncate" title={summary}>
        {summary}
      </span>
    </h3>
  {/snippet}

  {#snippet actions()}
    <Dropdown align="end">
      {#snippet trigger(attrs)}
        <button
          {...attrs}
          type="button"
          class="hover:bg-surface-25-hover-bg hover:text-fg-default text-fg-muted transition-ink focus-visible:outline-brand flex size-7 cursor-pointer items-center justify-center rounded-md focus-visible:outline-2"
          aria-haspopup="menu"
          aria-label="Actions for {insight.title}"
        >
          <MoreIcon class="size-4" />
        </button>
      {/snippet}

      <div
        class={[MENU_PANEL, 'w-44']}
        role="menu"
        tabindex="-1"
        aria-label="Actions for {insight.title}"
        onkeydown={onMenuArrowKeys}
      >
        <button
          type="button"
          role="menuitem"
          class={MENU_ROW}
          onclick={() => onedit(insight)}
        >
          Edit
        </button>
        <button
          type="button"
          role="menuitem"
          class={[
            MENU_ROW,
            'disabled:text-fg-disabled disabled:pointer-events-none',
          ]}
          disabled={first}
          onclick={() => onmove(insight, -1)}
        >
          Move earlier
        </button>
        <button
          type="button"
          role="menuitem"
          class={[
            MENU_ROW,
            'disabled:text-fg-disabled disabled:pointer-events-none',
          ]}
          disabled={last}
          onclick={() => onmove(insight, 1)}
        >
          Move later
        </button>
        <button
          type="button"
          role="menuitem"
          class={[MENU_ROW, 'text-error']}
          onclick={() => onremove(insight)}
        >
          Remove
        </button>
      </div>
    </Dropdown>
  {/snippet}

  {#if result.error}
    <p class="text-error px-3 py-16 text-center text-sm" role="alert">
      {result.error}
    </p>
  {:else if !result.data || result.data.type !== insight.type}
    <div class="flex min-h-60 flex-1 items-center justify-center">
      <Spinner />
    </div>
  {:else}
    {@const data = result.data}
    <div class="flex flex-1 flex-col gap-2">
      {#if insight.type === 'funnel'}
        <InsightFunnel
          steps={data.steps ?? []}
          people={insight.mode === 'people'}
          filters={(insight.events ?? []).map((event) => event.filters)}
        />
      {:else if insight.type === 'trend'}
        <InsightTrend
          times={data.times ?? []}
          series={data.series ?? []}
          events={insight.events ?? []}
          bucket={insight.bucket ?? defaultBucket('trend')}
          partial={endsInProgress(data.to)}
          label={insight.title}
        />
      {:else if insight.type === 'distribution'}
        <InsightHistogram
          bins={data.bins ?? []}
          summary={data.summary ?? { count: 0, mean: null, median: null }}
          binSize={insight.binSize ?? 1}
        />
      {:else}
        <InsightCohorts
          cohorts={data.cohorts ?? []}
          events={insight.events ?? []}
          bucket={insight.bucket ?? defaultBucket('cohorts')}
          property={insight.property ?? 'cohort'}
          lagDays={data.lagDays ?? []}
        />
      {/if}
    </div>
  {/if}
</Well>
