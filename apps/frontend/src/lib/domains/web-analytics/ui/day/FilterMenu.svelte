<script lang="ts">
  import { TOOLBAR_ICON_CONTROL } from '$lib/domains/shared/ui/components/toolbar.js';
  import ChevronLeftIcon from '$lib/domains/shared/icons/ChevronLeftIcon.svelte';
  import ChevronRightIcon from '$lib/domains/shared/icons/ChevronRightIcon.svelte';
  import FilterIcon from '$lib/domains/shared/icons/FilterIcon.svelte';
  import SearchIcon from '$lib/domains/shared/icons/SearchIcon.svelte';
  import { Dropdown, Spinner, Tooltip } from '@logdash/hyper-ui/presentational';
  import {
    FILTER_BREAKDOWNS,
    filterValueLabel,
  } from '../../domain/analytics-format';
  import {
    FILTER_LABELS,
    withFilter,
    type AnalyticsQuery,
  } from '../../domain/analytics-query';
  import type {
    WebAnalyticsFilterDimension,
    WebAnalyticsReport,
  } from '../../domain/web-analytics';

  type Props = {
    query: AnalyticsQuery;
    report: WebAnalyticsReport | null;
    onchange: (query: AnalyticsQuery) => void;
    onopen: () => void;
  };

  const { query, report, onchange, onopen }: Props = $props();

  const MENU_ROW =
    'hover:bg-surface-elevated-hover-bg flex h-8 w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 text-left text-sm';

  let dimension = $state<WebAnalyticsFilterDimension | null>(null);
  let search = $state('');

  const values = $derived.by((): string[] => {
    if (!dimension || !report) return [];
    const needle = search.trim().toLowerCase();
    const names =
      dimension === 'app'
        ? report.apps.map((app) => app.name)
        : report.breakdowns[FILTER_BREAKDOWNS[dimension]].map(
            (row) => row.name,
          );
    return names.filter((name) =>
      filterValueLabel(dimension!, name).toLowerCase().includes(needle),
    );
  });

  function onPickDimension(
    event: MouseEvent,
    next: WebAnalyticsFilterDimension | null,
  ): void {
    event.stopPropagation();
    dimension = next;
    search = '';
  }

  function onPickValue(value: string): void {
    if (!dimension) return;
    onchange(withFilter(query, { dimension, value }));
    dimension = null;
  }

  function onToggle(event: ToggleEvent): void {
    if (event.newState === 'open') onopen();
    else dimension = null;
  }

  function focusOnMount(node: HTMLInputElement): void {
    node.focus();
  }
</script>

<Dropdown ontoggle={onToggle} align="end">
  {#snippet trigger(attrs)}
    <Tooltip content="Filter" placement="bottom">
      <button
        {...attrs}
        type="button"
        class={TOOLBAR_ICON_CONTROL}
        aria-label="Add filter"
      >
        <FilterIcon class="size-3.5" />
      </button>
    </Tooltip>
  {/snippet}
  <div
    class="bg-surface-elevated-bg border-surface-elevated-border mt-2 w-64 rounded-xl border p-1.5 shadow-lg"
  >
    {#if dimension}
      <div class="flex items-center gap-1 pb-1.5">
        <button
          type="button"
          class="hover:bg-surface-elevated-hover-bg flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg"
          aria-label="Back to filter types"
          onclick={(event) => onPickDimension(event, null)}
        >
          <ChevronLeftIcon class="size-4" />
        </button>
        <label class="relative h-8 flex-1">
          <span class="sr-only">Search {FILTER_LABELS[dimension]}</span>
          <SearchIcon
            class="text-fg-muted pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2"
          />
          <input
            bind:value={search}
            {@attach focusOnMount}
            class="ld-input py-0 pr-2 pl-8"
            placeholder={FILTER_LABELS[dimension]}
          />
        </label>
      </div>
      {#if !report}
        <div class="flex justify-center py-4"><Spinner /></div>
      {:else}
        <ul class="flex max-h-72 flex-col overflow-y-auto">
          {#each values as value (value)}
            <li>
              <button
                type="button"
                class={MENU_ROW}
                onclick={() => onPickValue(value)}
              >
                <span class="truncate">
                  {filterValueLabel(dimension, value)}
                </span>
              </button>
            </li>
          {:else}
            <li class="text-fg-muted px-2.5 py-2 text-sm">No values</li>
          {/each}
        </ul>
      {/if}
    {:else}
      <p class="text-fg-muted px-2.5 pt-1 pb-1.5 text-xs">Filter by</p>
      <ul class="flex flex-col">
        {#each Object.entries(FILTER_LABELS) as [key, label] (key)}
          <li>
            <button
              type="button"
              class={MENU_ROW}
              onclick={(event) =>
                onPickDimension(event, key as WebAnalyticsFilterDimension)}
            >
              {label}
              <ChevronRightIcon class="text-fg-muted ml-auto size-3.5" />
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</Dropdown>
