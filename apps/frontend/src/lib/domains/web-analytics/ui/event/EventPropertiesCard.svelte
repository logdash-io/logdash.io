<script lang="ts">
  import SegmentedControl from '$lib/domains/shared/ui/components/SegmentedControl.svelte';
  import { Spinner } from '@logdash/hyper-ui/presentational';
  import { untrack } from 'svelte';
  import { WebAnalyticsInsightState } from '../../application/web-analytics-dashboard.state.svelte';
  import { formatCount } from '../../domain/analytics-format';
  import type {
    WebAnalyticsBreakdownRow,
    WebAnalyticsEvent,
    WebAnalyticsFilter,
    WebAnalyticsRange,
  } from '../../domain/web-analytics';
  import { WebAnalyticsService } from '../../infrastructure/web-analytics.service';
  import { CARD_COLUMNS } from '../breakdown/dashboard-card';

  type Props = {
    clusterId: string;
    name: string;
    range: WebAnalyticsRange;
    event: WebAnalyticsEvent | null;
    onfilter: (filter: WebAnalyticsFilter) => void;
  };

  type PropertyValues = { key: string; rows: WebAnalyticsBreakdownRow[] };

  const { clusterId, name, range, event, onfilter }: Props = $props();

  const OTHER = '(other)';

  let selected = $state<string | null>(null);

  const keys = $derived(event?.properties ?? []);
  const key = $derived(
    keys.find((entry) => entry.name === selected)?.name ??
      keys[0]?.name ??
      null,
  );
  const values = new WebAnalyticsInsightState<PropertyValues>(async () => {
    const current = key ?? '';
    return {
      key: current,
      rows: await WebAnalyticsService.readEventProperty(
        clusterId,
        name,
        current,
        range,
      ),
    };
  });
  const rows = $derived(values.data?.rows ?? []);
  const peak = $derived(Math.max(1, ...rows.map((row) => row.count)));

  $effect(() => {
    if (!event || !key) return;
    void untrack(() => values.load());
  });

  function onKey(value: string): void {
    selected = value;
  }

  function onSelect(row: WebAnalyticsBreakdownRow): void {
    if (!values.data) return;
    onfilter({ dimension: `prop.${values.data.key}`, value: row.name });
  }
</script>

<section
  class="bg-surface-25-bg flex min-h-48 min-w-0 flex-col gap-2 rounded-2xl p-2"
  aria-label="Properties of {name}"
>
  <header class="flex h-7 shrink-0 items-center justify-between gap-3">
    {#if keys.length > 1 && key}
      <div class="min-w-0 overflow-x-auto [scrollbar-width:none]">
        <SegmentedControl
          size="xs"
          label="Property"
          options={keys.map((entry) => ({
            value: entry.name,
            label: entry.name,
          }))}
          value={key}
          onChange={onKey}
        />
      </div>
    {:else}
      <h2 class="truncate px-3 text-[13px] font-medium">Properties</h2>
    {/if}
  </header>

  {#if !event || (key && !values.data && !values.error)}
    <div class="flex flex-1 items-center justify-center py-16">
      <Spinner />
    </div>
  {:else if !keys.length}
    <div
      class="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-12 text-center"
    >
      <p class="font-medium">No properties in this period</p>
      <p class="text-fg-tertiary text-sm">
        Send properties with the event to break it down by their values:
      </p>
      <code
        class="bg-surface-150-bg max-w-full truncate rounded-md px-2 py-1 font-mono text-xs"
      >
        {`window.logdash?.track('${name}', { variant: 'b' })`}
      </code>
    </div>
  {:else if values.error}
    <p class="text-error py-10 text-center text-sm" role="alert">
      {values.error}
    </p>
  {:else if values.data}
    <div class={CARD_COLUMNS}>
      <span class="truncate font-mono">{values.data.key}</span>
      <span class="flex shrink-0 gap-6">
        <span class="w-16 text-right">Events</span>
        <span class="w-16 text-right">Visitors</span>
      </span>
    </div>
    <ul class="flex flex-col gap-0.5">
      {#each rows as row (row.name)}
        <li>
          <button
            type="button"
            class="group focus-visible:outline-brand relative flex h-8 w-full cursor-pointer items-center gap-3 rounded-lg px-3 text-left text-sm focus-visible:outline-2"
            title="Filter by {values.data.key} {row.name}"
            onclick={() => onSelect(row)}
          >
            <span
              class="bg-surface-150-bg group-hover:bg-surface-150-hover-bg absolute inset-y-0 left-0 rounded-lg"
              style:width="{Math.max(1.5, (row.count / peak) * 100)}%"
              aria-hidden="true"
            ></span>
            <span
              class={[
                'relative min-w-0 flex-1 truncate',
                { 'text-fg-tertiary': row.name === OTHER },
              ]}
            >
              {row.name}
            </span>
            <span class="relative flex shrink-0 gap-6 tabular-nums">
              <span class="w-16 text-right font-medium">
                {formatCount(row.count)}
              </span>
              <span class="text-fg-tertiary w-16 text-right">
                {formatCount(row.visitors)}
              </span>
            </span>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</section>
