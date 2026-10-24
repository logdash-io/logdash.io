<script lang="ts">
  import SearchIcon from '$lib/domains/shared/icons/SearchIcon.svelte';
  import { Spinner } from '@logdash/hyper-ui/presentational';
  import { untrack } from 'svelte';
  import { WebAnalyticsBreakdownState } from '../../application/web-analytics-dashboard.state.svelte';
  import { countryName } from '../../domain/analytics-format';
  import type {
    WebAnalyticsBreakdownName,
    WebAnalyticsBreakdownRow,
    WebAnalyticsRange,
  } from '../../domain/web-analytics';
  import BreakdownList from './BreakdownList.svelte';
  import DetailsDialog from './DetailsDialog.svelte';

  type Props = {
    isOpen: boolean;
    clusterId: string;
    range: WebAnalyticsRange;
    title: string;
    dimension: WebAnalyticsBreakdownName;
    onselect: (row: WebAnalyticsBreakdownRow) => void;
    onclose: () => void;
  };

  const {
    isOpen,
    clusterId,
    range,
    title,
    dimension,
    onselect,
    onclose,
  }: Props = $props();

  const breakdown = new WebAnalyticsBreakdownState(untrack(() => clusterId));
  let search = $state('');

  const rows = $derived.by((): WebAnalyticsBreakdownRow[] => {
    const needle = search.trim().toLowerCase();
    if (!needle) return breakdown.rows;
    return breakdown.rows.filter((row) =>
      (dimension === 'countries' ? countryName(row.name) : row.name)
        .toLowerCase()
        .includes(needle),
    );
  });

  $effect(() => {
    if (!isOpen) return;
    const current = { range, dimension };
    untrack(() => {
      search = '';
      void breakdown.load(current.range, current.dimension);
    });
  });

  function focusOnMount(node: HTMLInputElement): void {
    requestAnimationFrame(() => node.focus());
  }
</script>

<DetailsDialog {isOpen} {title} {onclose}>
  <label class="relative mx-5 mt-4 block h-9">
    <span class="sr-only">Search {title.toLowerCase()}</span>
    <SearchIcon
      class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-muted"
    />
    <input
      bind:value={search}
      {@attach focusOnMount}
      class="ld-input py-0 pr-3 pl-9"
      placeholder="Search"
    />
  </label>
  <div class="flex items-center justify-between px-8 pt-4 pb-1.5 text-xs">
    <span class="text-fg-muted">{title}</span>
    <span class="text-fg-muted">Visitors</span>
  </div>
  <div class="min-h-40 flex-1 overflow-y-auto px-5 pb-5">
    {#if breakdown.loading}
      <div class="flex h-40 items-center justify-center">
        <Spinner />
      </div>
    {:else if breakdown.error}
      <p class="text-error py-6 text-center text-sm" role="alert">
        {breakdown.error}
      </p>
    {:else if !rows.length}
      <p class="text-fg-muted py-6 text-center text-sm">No matches</p>
    {:else}
      <BreakdownList {rows} {dimension} {onselect} />
    {/if}
  </div>
</DetailsDialog>
