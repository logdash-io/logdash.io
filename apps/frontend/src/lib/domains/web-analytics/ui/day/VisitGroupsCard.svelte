<script lang="ts">
  import { formatCount, formatDuration } from '../../domain/analytics-format';
  import {
    formatInterval,
    formatRate,
    type GroupRow,
    type RateVerdict,
  } from '../../domain/day-analytics';
  import BreakdownLabel from '../breakdown/BreakdownLabel.svelte';
  import Flag from './Flag.svelte';

  type Props = {
    title: string;
    column: string;
    rows: GroupRow[];
    by: string;
    weekdays: string;
    loading: boolean;
    spot?: string | null;
    pinned?: string | null;
    onhover?: (name: string | null) => void;
    onpin?: (name: string) => void;
  };

  const {
    title,
    column,
    rows,
    by,
    weekdays,
    loading,
    spot = null,
    pinned = null,
    onhover,
    onpin,
  }: Props = $props();

  const peak = $derived(Math.max(1, ...rows.map((row) => row.counts.visits)));
  const FLAGGED = 'pr-[26px] @xl:pr-[30px]';
</script>

<section
  class="bg-surface-25-bg @container flex min-w-0 flex-col gap-2 rounded-2xl p-2"
  aria-label={title}
>
  <header
    class="flex min-h-7 flex-wrap items-center justify-between gap-x-3 gap-y-1"
  >
    <h2 class="px-3 text-[13px] font-medium">{title}</h2>
    <p class="text-fg-muted px-3 text-xs">
      Rates with their 95% interval. Arrows mark what is beyond noise.
      {onpin ? 'Point at a source to see it in the charts.' : ''}
    </p>
  </header>

  {#if loading && !rows.length}
    <div class="flex flex-col gap-0.5 pt-6" aria-hidden="true">
      {#each [88, 64, 46, 32, 22] as width (width)}
        <div
          class="bg-surface-150-bg h-8 rounded-lg"
          style:width="{width}%"
        ></div>
      {/each}
    </div>
  {:else if !rows.length}
    <p class="text-fg-muted py-10 text-center text-sm">No visits yet</p>
  {:else}
    <table
      class="w-full table-auto border-separate border-spacing-y-0.5 text-sm whitespace-nowrap @xl:table-fixed"
    >
      <thead class="text-fg-muted text-xs">
        <tr>
          <th
            scope="col"
            class="h-6 w-full px-2 text-left font-normal @xl:w-[30%] @xl:px-3"
          >
            {column}
          </th>
          <th
            scope="col"
            class={['h-6 px-2 text-right font-normal @xl:px-3', FLAGGED]}
          >
            Visits
          </th>
          <th
            scope="col"
            class={['h-6 px-2 text-right font-normal @xl:px-3', FLAGGED]}
          >
            Stayed
          </th>
          <th
            scope="col"
            class="hidden h-6 px-3 text-right font-normal @3xl:table-cell"
          >
            Median stay
          </th>
        </tr>
      </thead>
      <tbody>
        {#each rows as row (row.name)}
          {@const lit = row.name === spot || row.name === pinned}
          <tr
            class="group"
            onpointerenter={() => onhover?.(row.name)}
            onpointerleave={() => onhover?.(null)}
          >
            <td
              class={[
                'group-hover:bg-surface-25-hover-bg relative h-11 max-w-0 rounded-l-lg @xl:h-9 @xl:max-w-none',
                onpin ? 'p-0' : 'px-2 @xl:px-3',
              ]}
            >
              <span
                class={[
                  'absolute inset-y-[3px] left-0 rounded-md',
                  lit
                    ? 'bg-surface-150-selected-bg'
                    : 'bg-surface-150-bg group-hover:bg-surface-150-hover-bg',
                ]}
                style:width="{Math.max(1.5, (row.counts.visits / peak) * 100)}%"
                aria-hidden="true"
              ></span>
              {#if onpin}
                <button
                  type="button"
                  class="focus-visible:outline-brand relative flex h-full w-full min-w-0 cursor-pointer items-center gap-2 rounded-lg px-2 text-left outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 @xl:px-3"
                  aria-pressed={row.name === pinned}
                  title={row.name === pinned
                    ? 'Stop showing it in the charts'
                    : 'Keep it in the charts'}
                  onfocus={() => onhover?.(row.name)}
                  onblur={() => onhover?.(null)}
                  onclick={() => onpin(row.name)}
                >
                  <BreakdownLabel dimension="referrers" name={row.name} />
                </button>
              {:else}
                <span class="relative block truncate">{row.name}</span>
              {/if}
            </td>
            <td
              class="group-hover:bg-surface-25-hover-bg relative px-2 text-right tabular-nums @xl:px-3"
            >
              <span
                class="relative inline-flex items-baseline justify-end gap-1"
              >
                {formatCount(row.counts.visits)}
                <Flag
                  label="{row.name}, visits"
                  verdict={row.verdict.visits}
                  {by}
                  {weekdays}
                  variant="mark"
                />
              </span>
            </td>
            <td
              class="group-hover:bg-surface-25-hover-bg relative rounded-r-lg px-2 text-right @xl:px-3 @3xl:rounded-none"
            >
              {@render rate(row.name, 'stayed', row.verdict.stayed, 'stayed')}
            </td>
            <td
              class="group-hover:bg-surface-25-hover-bg text-fg-tertiary hidden rounded-r-lg px-3 text-right tabular-nums @3xl:table-cell"
            >
              {row.counts.visits ? formatDuration(row.medianSeconds) : '-'}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</section>

{#snippet rate(
  name: string,
  label: string,
  verdict: RateVerdict,
  reached: string,
)}
  <span class="relative inline-flex items-baseline justify-end gap-1">
    {#if verdict.rate === null}
      <span class="text-fg-muted">-</span>
    {:else}
      <span
        class="flex flex-col items-end leading-4 tabular-nums @xl:flex-row @xl:items-baseline @xl:gap-1 @xl:leading-5"
      >
        <span>{formatRate(verdict.rate)}</span>
        <span class="text-fg-muted text-[11px] @xl:text-xs">
          {formatInterval(verdict.interval)}
        </span>
      </span>
    {/if}
    <Flag
      label="{name}, {label}"
      {verdict}
      {by}
      {weekdays}
      {reached}
      variant="mark"
    />
  </span>
{/snippet}
