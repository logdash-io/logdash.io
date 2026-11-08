<script lang="ts">
  import { formatCount, formatPercent } from '../../domain/analytics-format';
  import { formatInterval } from '../../domain/day-analytics';
  import type {
    WebAnalyticsInsightFilter,
    WebAnalyticsInsightStep,
  } from '../../domain/web-analytics';
  import {
    commonPrefix,
    funnelRows,
    stepKind,
    stepValue,
  } from '../../domain/web-analytics-insight';
  import { CARD_COLUMNS } from '../breakdown/dashboard-card';
  import InsightEventName from './InsightEventName.svelte';

  type Props = {
    steps: WebAnalyticsInsightStep[];
    people: boolean;
    filters: WebAnalyticsInsightFilter[][];
  };

  const { steps, people, filters }: Props = $props();

  const rows = $derived(funnelRows(steps));
  const prefix = $derived(
    people ? '' : commonPrefix(steps.map((step) => step.name)),
  );
</script>

<div class={CARD_COLUMNS}>
  <span>Step</span>
  <span class="flex gap-3">
    <span class="w-16 text-right">{people ? 'People' : 'Events'}</span>
    <span class="w-26 text-right">Conversion</span>
    <span class="w-16 text-right @max-sm:hidden">Dropped</span>
  </span>
</div>
<ol class="flex flex-col gap-0.5">
  {#each rows as row, index (index)}
    <li class="relative flex min-h-9 items-center gap-3 rounded-lg px-3 py-1.5">
      <span
        class="bg-surface-150-bg absolute inset-y-0 left-0 rounded-lg"
        style:width="{row.count
          ? Math.max(1.5, Math.min(100, row.overall))
          : 0}%"
        aria-hidden="true"
      ></span>
      <span class="text-fg-muted relative w-3 shrink-0 text-xs tabular-nums">
        {index + 1}
      </span>
      <span class="relative min-w-0 flex-1 text-sm">
        {#if people}
          <span class="flex min-w-0 items-baseline gap-1.5">
            <span class="text-fg-muted shrink-0 text-xs">
              {stepKind(row.name) === 'goal' ? 'Goal' : 'Page'}
            </span>
            <span class="truncate" title={stepValue(row.name)}>
              {stepValue(row.name)}
            </span>
          </span>
        {:else}
          <InsightEventName
            name={row.name}
            {prefix}
            filters={filters[index] ?? []}
          />
        {/if}
      </span>
      <span class="relative flex shrink-0 gap-3 text-sm tabular-nums">
        <span class="w-16 text-right font-medium">
          {formatCount(row.count)}
        </span>
        <span class="text-fg-tertiary w-26 text-right whitespace-nowrap">
          {row.conversion === null ? '' : formatPercent(row.conversion)}
          {#if row.interval}
            <span class="text-fg-muted text-xs">
              {formatInterval(row.interval)}
            </span>
          {/if}
        </span>
        <span class="text-fg-tertiary w-16 text-right @max-sm:hidden">
          {row.dropped === null ? '' : formatCount(row.dropped)}
        </span>
      </span>
    </li>
  {/each}
</ol>
