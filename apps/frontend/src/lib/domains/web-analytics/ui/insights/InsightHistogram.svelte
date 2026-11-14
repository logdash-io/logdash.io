<script lang="ts">
  import * as d3 from 'd3';
  import { formatCount, formatPercent } from '../../domain/analytics-format';
  import type { WebAnalyticsInsightBin } from '../../domain/web-analytics';
  import { histogramBinLabel } from '../../domain/web-analytics-insight';

  type Props = {
    bins: WebAnalyticsInsightBin[];
    summary: { count: number; mean: number | null; median: number | null };
    binSize: number;
    people?: boolean;
    property?: string;
  };

  const { bins, summary, binSize, people = false, property }: Props = $props();

  const LABEL_WIDTH = 28;

  let hovered = $state<number | null>(null);
  let width = $state(0);

  const y = $derived(
    d3
      .scaleLinear()
      .domain([0, Math.max(1, ...bins.map((bin) => bin.share))])
      .nice(4),
  );
  const top = $derived(y.domain()[1]);
  const ticks = $derived(y.ticks(4));
  const labelStep = $derived(
    Math.ceil(bins.length / Math.max(2, Math.floor(width / LABEL_WIDTH))),
  );
  const readout = $derived(hovered === null ? null : bins[hovered]);

  function binLabel(bin: WebAnalyticsInsightBin): string {
    return histogramBinLabel(bin.value, binSize, people);
  }

  function onHover(index: number | null): void {
    hovered = index;
  }
</script>

{#if !bins.length}
  <p
    class="text-fg-muted flex flex-1 items-center justify-center px-3 py-16 text-center text-sm"
  >
    {people
      ? 'No people yet. An event counts a person only when the app sends a user ID.'
      : `No events with a numeric ${property} in this period`}
  </p>
{:else}
  <dl class="flex flex-wrap gap-x-6 gap-y-1 px-3 text-sm">
    {@render stat(people ? 'People' : 'Events', formatCount(summary.count))}
    {@render stat(
      'Mean',
      summary.mean === null ? '–' : formatCount(summary.mean),
    )}
    {@render stat(
      'Median',
      summary.median === null ? '–' : formatCount(summary.median),
    )}
    {#if readout}
      <div class="ml-auto flex items-baseline gap-1.5">
        <dt class="text-fg-muted">{binLabel(readout)}</dt>
        <dd class="font-medium tabular-nums">
          {formatCount(readout.count)}
          <span class="text-fg-tertiary font-normal">
            {formatPercent(readout.share)}
          </span>
        </dd>
      </div>
    {/if}
  </dl>

  <div class="flex min-h-0 flex-1 flex-col px-3 pt-2 pb-1">
    <div class="flex min-h-32 flex-1">
      <div class="relative w-10 shrink-0" aria-hidden="true">
        {#each ticks as tick (tick)}
          <span
            class="text-fg-muted absolute right-2 translate-y-1/2 text-[11px] tabular-nums"
            style:bottom="{(tick / top) * 100}%"
          >
            {tick}%
          </span>
        {/each}
      </div>
      <div class="relative flex-1" bind:clientWidth={width}>
        {#each ticks as tick (tick)}
          <span
            class={[
              'border-surface-50-border absolute inset-x-0 border-t',
              tick && 'border-dashed',
            ]}
            style:bottom="{(tick / top) * 100}%"
            aria-hidden="true"
          ></span>
        {/each}
        <ul
          class="relative flex h-full items-end"
          aria-label={people ? 'People by active days' : 'Events by value'}
          onpointerleave={() => onHover(null)}
        >
          {#each bins as bin, index (bin.value)}
            <li
              class="flex h-full min-w-0 flex-1 flex-col items-center justify-end"
              aria-label="{binLabel(bin)}: {formatCount(bin.count)}"
              onpointerenter={() => onHover(index)}
            >
              <span
                class={[
                  'block w-3/5 max-w-6 rounded-t-sm',
                  hovered === index ? 'bg-surface-inverse-bg' : 'bg-chart-1',
                ]}
                style:height="{bin.count
                  ? Math.max(1, (bin.share / top) * 100)
                  : 0}%"
              ></span>
            </li>
          {/each}
        </ul>
      </div>
    </div>
    <div class="flex pt-1.5 pl-10" aria-hidden="true">
      {#each bins as bin, index (bin.value)}
        <span
          class="text-fg-muted flex min-w-0 flex-1 justify-center text-[11px] whitespace-nowrap tabular-nums"
        >
          {index % labelStep === 0 ? formatCount(bin.value) : ''}
        </span>
      {/each}
    </div>
  </div>
{/if}

{#snippet stat(label: string, value: string)}
  <div class="flex items-baseline gap-1.5">
    <dt class="text-fg-muted">{label}</dt>
    <dd class="font-medium tabular-nums">{value}</dd>
  </div>
{/snippet}
