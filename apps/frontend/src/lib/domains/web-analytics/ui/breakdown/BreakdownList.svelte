<script lang="ts">
  import { formatCount } from '../../domain/analytics-format';
  import type {
    WebAnalyticsBreakdownName,
    WebAnalyticsBreakdownRow,
  } from '../../domain/web-analytics';
  import BreakdownLabel from './BreakdownLabel.svelte';

  type Props = {
    rows: WebAnalyticsBreakdownRow[];
    dimension: WebAnalyticsBreakdownName;
    value?: 'visitors' | 'count';
    onselect?: (row: WebAnalyticsBreakdownRow) => void;
  };

  const { rows, dimension, value = 'visitors', onselect }: Props = $props();

  const peak = $derived(Math.max(1, ...rows.map((row) => row[value])));
</script>

<ul class="flex flex-col gap-0.5">
  {#each rows as row (row.name)}
    <li>
      <button
        type="button"
        class="group focus-visible:outline-brand relative flex h-8 w-full cursor-pointer items-center gap-3 rounded-lg px-3 text-left text-sm focus-visible:outline-2 disabled:cursor-default"
        disabled={!onselect}
        title={onselect ? `Filter by ${row.name}` : row.name}
        onclick={() => onselect?.(row)}
      >
        <span
          class="bg-surface-150-bg group-hover:bg-surface-150-hover-bg absolute inset-y-0 left-0 rounded-lg"
          style:width="{Math.max(1.5, (row[value] / peak) * 100)}%"
          aria-hidden="true"
        ></span>
        <span class="relative flex min-w-0 flex-1 items-center gap-2">
          <BreakdownLabel {dimension} name={row.name} />
        </span>
        <span class="relative shrink-0 font-medium tabular-nums">
          {formatCount(row[value])}
        </span>
      </button>
    </li>
  {/each}
</ul>
