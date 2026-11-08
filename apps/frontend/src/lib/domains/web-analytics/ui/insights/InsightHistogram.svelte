<script lang="ts">
  import { formatCount, formatPercent } from '../../domain/analytics-format';
  import type { WebAnalyticsInsightBin } from '../../domain/web-analytics';

  type Props = {
    bins: WebAnalyticsInsightBin[];
    summary: { count: number; mean: number | null; median: number | null };
    binSize: number;
  };

  const { bins, summary, binSize }: Props = $props();

  const MAX_LABELS = 8;

  let hovered = $state<number | null>(null);

  const peak = $derived(Math.max(1, ...bins.map((bin) => bin.count)));
  const labelStep = $derived(Math.ceil(bins.length / MAX_LABELS));
  const readout = $derived(hovered === null ? null : bins[hovered]);

  function binLabel(bin: WebAnalyticsInsightBin): string {
    if (binSize === 1 && Number.isInteger(bin.value))
      return formatCount(bin.value);
    return `${formatCount(bin.value)} to ${formatCount(bin.value + binSize)}`;
  }

  function onHover(index: number | null): void {
    hovered = index;
  }
</script>

<dl class="flex flex-wrap gap-x-6 gap-y-1 px-3 text-sm">
  {@render stat('Events', formatCount(summary.count))}
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

<div class="flex flex-col gap-1.5 px-3 pb-1">
  <ul
    class="flex h-44 items-end gap-0.5"
    aria-label="Events by value"
    onpointerleave={() => onHover(null)}
  >
    {#each bins as bin, index (bin.value)}
      <li
        class="flex h-full min-w-0 flex-1 flex-col justify-end"
        aria-label="{binLabel(bin)}: {formatCount(bin.count)}"
        onpointerenter={() => onHover(index)}
      >
        <span
          class={[
            'block rounded-t-sm',
            hovered === index ? 'bg-surface-inverse-bg' : 'bg-chart-1',
          ]}
          style:height="{bin.count
            ? Math.max(1, (bin.count / peak) * 100)
            : 0}%"
        ></span>
      </li>
    {/each}
  </ul>
  <div class="edge-t flex gap-0.5 pt-1.5" aria-hidden="true">
    {#each bins as bin, index (bin.value)}
      <span
        class="text-fg-muted min-w-0 flex-1 overflow-visible text-[11px] whitespace-nowrap tabular-nums"
      >
        {index % labelStep === 0 ? formatCount(bin.value) : ''}
      </span>
    {/each}
  </div>
</div>

{#snippet stat(label: string, value: string)}
  <div class="flex items-baseline gap-1.5">
    <dt class="text-fg-muted">{label}</dt>
    <dd class="font-medium tabular-nums">{value}</dd>
  </div>
{/snippet}
