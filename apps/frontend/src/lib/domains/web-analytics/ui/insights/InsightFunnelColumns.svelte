<script lang="ts">
  import { Tooltip } from '@logdash/hyper-ui/presentational';
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
    type WebAnalyticsFunnelRow,
  } from '../../domain/web-analytics-insight';
  import InsightEventName from './InsightEventName.svelte';

  type Props = {
    steps: WebAnalyticsInsightStep[];
    people: boolean;
    filters: WebAnalyticsInsightFilter[][];
  };

  const { steps, people, filters }: Props = $props();

  const TICKS = [100, 75, 50, 25, 0];
  const BAR_MIN_WIDTH = 56;
  const AXIS_WIDTH = 40;
  const MIN_SHARE = 0.8;

  const rows = $derived(funnelRows(steps));
  const prefix = $derived(
    people ? '' : commonPrefix(steps.map((step) => step.name)),
  );
  const gap = $derived(rows.length > 4 ? 84 : 96);
  const columns = $derived(rows.map(() => 'minmax(0, 1fr)').join(` ${gap}px `));
  const minWidth = $derived(
    rows.length * BAR_MIN_WIDTH + (rows.length - 1) * gap + AXIS_WIDTH,
  );

  function share(row: WebAnalyticsFunnelRow): number {
    return row.count ? Math.max(row.overall, MIN_SHARE) : 0;
  }

  function counted(count: number): string {
    if (count !== 1)
      return `${formatCount(count)} ${people ? 'people' : 'events'}`;
    return `1 ${people ? 'person' : 'event'}`;
  }

  function spoken(row: WebAnalyticsFunnelRow): string {
    const share = `${formatPercent(row.overall)} of step 1`;
    if (row.conversion === null) return share;
    return `${share}, ${formatPercent(row.conversion)} from the step before, 95% interval ${formatInterval(row.interval)}, ${formatCount(row.dropped ?? 0)} dropped`;
  }

  function breakable(text: string): string {
    return text.replaceAll(/[/_]/g, '$&\u200b');
  }
</script>

<div class="overflow-x-auto px-3 pt-2 pb-1">
  <div style:min-width="{minWidth}px" style:padding-left="{AXIS_WIDTH}px">
    <div class="relative h-60" aria-hidden="true">
      {#each TICKS as tick (tick)}
        <span
          class={[
            'border-surface-25-border absolute inset-x-0 border-t',
            { 'border-dashed': tick },
          ]}
          style:top="{100 - tick}%"
        >
          <span
            class="text-fg-muted absolute right-full mr-2 -translate-y-1/2 text-[11px] tabular-nums"
          >
            {tick}%
          </span>
        </span>
      {/each}
      <div
        class="absolute inset-0 grid grid-rows-1"
        style:grid-template-columns={columns}
      >
        {#each rows as row, index (index)}
          {#if row.conversion !== null}
            <span class="relative row-start-1" style:grid-column={index * 2}>
              <span
                class="bg-surface-25-bg border-surface-25-border absolute inset-x-1 flex flex-col items-start gap-px rounded-md border px-1.5 py-1 text-xs leading-4 whitespace-nowrap tabular-nums"
                style:top="min(calc({100 - rows[index - 1].overall}% + 2px),
                calc(100% - {row.interval ? 62 : 46}px))"
              >
                <span class="font-medium">
                  → {formatPercent(row.conversion)}
                </span>
                {#if row.interval}
                  <span class="text-fg-muted text-[11px]">
                    {formatInterval(row.interval)}
                  </span>
                {/if}
                <span class="text-error-fg">
                  −{formatCount(row.dropped ?? 0)}
                </span>
              </span>
            </span>
          {/if}
          <span class="row-start-1" style:grid-column={index * 2 + 1}>
            <Tooltip
              content={card}
              placement={index < rows.length / 2 ? 'right' : 'left'}
              align="top"
              class="group relative h-full w-full"
            >
              <span
                class="rest absolute inset-x-0 top-0 rounded-t-md"
                style:bottom="{share(row)}%"
              ></span>
              <span
                class="bg-chart-1 absolute inset-x-0 bottom-0 rounded-t-sm group-hover:brightness-110"
                style:height="{share(row)}%"
              ></span>
              <span
                class="bg-surface-elevated-bg border-surface-elevated-border absolute left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md border px-1.5 text-xs font-medium whitespace-nowrap tabular-nums"
                style:top="{100 - share(row)}%"
              >
                {formatPercent(row.overall)}
              </span>
            </Tooltip>
          </span>
          {#snippet card()}
            <div
              class="bg-surface-elevated-bg border-surface-elevated-border w-64 rounded-xl border px-3 py-2.5 text-sm shadow-lg"
            >
              <p class="text-fg-muted truncate text-xs">
                Step {index + 1}, {row.name}
              </p>
              <p class="mt-1.5 flex items-center justify-between gap-4">
                <span>{people ? 'People' : 'Events'}</span>
                <span class="font-medium tabular-nums">
                  {formatCount(row.count)}
                </span>
              </p>
              {@render fact('Of step 1', formatPercent(row.overall))}
              {#if row.conversion !== null}
                {@render fact(
                  'From the step before',
                  formatPercent(row.conversion),
                )}
                {#if row.interval}
                  {@render fact('95% interval', formatInterval(row.interval))}
                {/if}
                {@render fact('Dropped', formatCount(row.dropped ?? 0))}
              {/if}
            </div>
          {/snippet}
        {/each}
      </div>
    </div>
    <ol class="mt-2 grid" style:grid-template-columns={columns}>
      {#each rows as row, index (index)}
        <li
          class="min-w-0 px-0.5 text-center text-[13px] leading-[17px] wrap-anywhere"
          style:grid-column={index * 2 + 1}
        >
          {#if people}
            <span title={stepValue(row.name)}>
              <span class="text-fg-muted text-xs">
                {stepKind(row.name) === 'goal' ? 'Goal' : 'Page'}
              </span>
              {breakable(stepValue(row.name))}
            </span>
          {:else}
            <InsightEventName
              name={row.name.slice(prefix.length)}
              prefix=""
              filters={filters[index] ?? []}
              wrap
            />
          {/if}
          <span class="text-fg-tertiary mt-0.5 block text-xs tabular-nums">
            {counted(row.count)}
          </span>
          <span class="sr-only">{spoken(row)}</span>
        </li>
      {/each}
    </ol>
  </div>
</div>

{#snippet fact(label: string, value: string)}
  <p class="text-fg-tertiary mt-1 flex justify-between gap-4">
    <span>{label}</span>
    <span class="tabular-nums">{value}</span>
  </p>
{/snippet}

<style>
  .rest {
    background:
      repeating-linear-gradient(
        135deg,
        color-mix(in oklch, var(--chart-1) 26%, var(--surface-25-bg)) 0 1.5px,
        var(--rest-bg) 1.5px 7px
      ),
      var(--rest-bg);
    --rest-bg: color-mix(in oklch, var(--chart-1) 7%, var(--surface-25-bg));
  }
</style>
