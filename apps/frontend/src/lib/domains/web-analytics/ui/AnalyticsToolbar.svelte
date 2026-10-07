<script lang="ts">
  import {
    TOOLBAR_CONTROL,
    TOOLBAR_ICON_CONTROL,
  } from '$lib/domains/shared/ui/components/toolbar.js';
  import { Dropdown, Menu, Tooltip } from '@logdash/hyper-ui/presentational';
  import ChevronDownIcon from '$lib/domains/shared/icons/ChevronDownIcon.svelte';
  import ChevronLeftIcon from '$lib/domains/shared/icons/ChevronLeftIcon.svelte';
  import ChevronRightIcon from '$lib/domains/shared/icons/ChevronRightIcon.svelte';
  import FilterIcon from '$lib/domains/shared/icons/FilterIcon.svelte';
  import PlusCircleIcon from '$lib/domains/shared/icons/PlusCircleIcon.svelte';
  import RefreshIcon from '$lib/domains/shared/icons/RefreshIcon.svelte';
  import SearchIcon from '$lib/domains/shared/icons/SearchIcon.svelte';
  import {
    ANALYTICS_PERIODS,
    GRANULARITIES,
    allowedGranularities,
    defaultGranularity,
    type AnalyticsPeriod,
    type AnalyticsWindow,
  } from '../domain/analytics-period';
  import {
    FILTER_LABELS,
    withFilter,
    type AnalyticsQuery,
  } from '../domain/analytics-query';
  import {
    filterValueLabel,
    FILTER_BREAKDOWNS,
  } from '../domain/analytics-format';
  import type {
    WebAnalyticsFilterDimension,
    WebAnalyticsGranularity,
    WebAnalyticsReport,
  } from '../domain/web-analytics';

  type Props = {
    query: AnalyticsQuery;
    span: AnalyticsWindow;
    report: WebAnalyticsReport | null;
    loading: boolean;
    onchange: (query: AnalyticsQuery) => void;
    onrefresh: () => void;
  };

  const { query, span, report, loading, onchange, onrefresh }: Props = $props();

  const STEP_CONTROL =
    'hover:text-fg-default transition-ink focus-visible:outline-brand flex h-full w-8 cursor-pointer items-center justify-center text-fg-tertiary focus-visible:-outline-offset-2 focus-visible:outline-2 disabled:cursor-default disabled:text-fg-disabled';
  const MENU_ROW =
    'flex h-8 w-full items-center gap-2 rounded-lg px-2.5 text-left text-sm';

  const granularities = $derived(allowedGranularities(span));
  const granularityLabel = $derived(
    GRANULARITIES.find((entry) => entry.id === query.granularity)?.label,
  );

  let filterDimension = $state<WebAnalyticsFilterDimension | null>(null);
  let filterSearch = $state('');

  const filterValues = $derived.by((): string[] => {
    if (!filterDimension || !report) return [];
    const needle = filterSearch.trim().toLowerCase();
    return report.breakdowns[FILTER_BREAKDOWNS[filterDimension]]
      .map((row) => row.name)
      .filter((name) =>
        filterValueLabel(filterDimension!, name).toLowerCase().includes(needle),
      );
  });

  function onPeriod(period: AnalyticsPeriod): void {
    onchange({
      ...query,
      period,
      offset: 0,
      granularity: defaultGranularity(period),
    });
  }

  function onShift(step: number): void {
    onchange({ ...query, offset: query.offset + step });
  }

  function onGranularity(granularity: WebAnalyticsGranularity): void {
    onchange({ ...query, granularity });
  }

  function onCompare(): void {
    onchange({ ...query, compare: !query.compare });
  }

  function onPickDimension(
    event: MouseEvent,
    dimension: WebAnalyticsFilterDimension | null,
  ): void {
    event.stopPropagation();
    filterDimension = dimension;
    filterSearch = '';
  }

  function onPickValue(value: string): void {
    if (!filterDimension) return;
    onchange(withFilter(query, { dimension: filterDimension, value }));
    filterDimension = null;
  }

  function onFilterToggle(event: ToggleEvent): void {
    if (event.newState === 'closed') filterDimension = null;
  }

  function focusOnMount(node: HTMLInputElement): void {
    node.focus();
  }
</script>

<div class="flex flex-wrap items-center gap-2">
  {#if report}
    <Tooltip content="Visitors in the last 5 minutes" placement="bottom">
      <span
        class="bg-surface-100-bg text-fg-secondary flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[13px] tabular-nums"
      >
        <span
          class={[
            'size-1.5 rounded-full',
            report.online ? 'bg-success' : 'bg-idle',
          ]}
        ></span>
        {report.online} online
      </span>
    </Tooltip>
  {/if}

  <div class="flex h-8 shrink-0 items-center rounded-full edge">
    <button
      type="button"
      class={[STEP_CONTROL, 'rounded-l-full pl-1']}
      aria-label="Previous period"
      disabled={query.period === 'all'}
      onclick={() => onShift(-1)}
    >
      <ChevronLeftIcon class="size-3.5" />
    </button>
    <Dropdown>
      {#snippet trigger(attrs)}
        <button
          {...attrs}
          type="button"
          class="hover:text-fg-default transition-ink focus-visible:outline-brand flex h-full min-w-32 cursor-pointer items-center justify-between gap-2 edge-x px-3 text-sm focus-visible:-outline-offset-2 focus-visible:outline-2"
          aria-label="Period: {span.label}"
        >
          {span.label}
          <ChevronDownIcon class="size-3.5 text-fg-muted" />
        </button>
      {/snippet}
      <Menu
        size="sm"
        class="bg-surface-elevated-bg border-surface-elevated-border mt-2 w-48 border rounded-xl shadow-lg"
      >
        {#each ANALYTICS_PERIODS as period (period.id)}
          <li>
            <button
              type="button"
              class={[
                MENU_ROW,
                {
                  'bg-surface-elevated-selected-bg': period.id === query.period,
                },
              ]}
              aria-current={period.id === query.period ? 'true' : undefined}
              onclick={() => onPeriod(period.id)}
            >
              {period.label}
            </button>
          </li>
        {/each}
      </Menu>
    </Dropdown>
    <button
      type="button"
      class={[STEP_CONTROL, 'rounded-r-full pr-1']}
      aria-label="Next period"
      disabled={!span.canGoForward}
      onclick={() => onShift(1)}
    >
      <ChevronRightIcon class="size-3.5" />
    </button>
  </div>

  <button
    type="button"
    class={[
      TOOLBAR_CONTROL,
      query.compare ? 'bg-surface-150-bg text-fg-default' : 'text-fg-tertiary',
    ]}
    aria-pressed={query.compare}
    onclick={onCompare}
  >
    <PlusCircleIcon class="size-3.5" />
    Compare
  </button>

  <Dropdown>
    {#snippet trigger(attrs)}
      <button
        {...attrs}
        type="button"
        class={[TOOLBAR_CONTROL, 'text-fg-tertiary']}
        aria-label="Granularity: {granularityLabel}"
      >
        {granularityLabel}
        <ChevronDownIcon class="size-3.5 text-fg-muted" />
      </button>
    {/snippet}
    <Menu
      size="sm"
      class="bg-surface-elevated-bg border-surface-elevated-border mt-2 w-36 border rounded-xl shadow-lg"
    >
      {#each GRANULARITIES as granularity (granularity.id)}
        <li>
          <button
            type="button"
            class={[
              MENU_ROW,
              {
                'bg-surface-elevated-selected-bg':
                  granularity.id === query.granularity,
              },
            ]}
            disabled={!granularities.includes(granularity.id)}
            onclick={() => onGranularity(granularity.id)}
          >
            {granularity.label}
          </button>
        </li>
      {/each}
    </Menu>
  </Dropdown>

  <Dropdown ontoggle={onFilterToggle}>
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
      class="bg-surface-elevated-bg border-surface-elevated-border mt-2 w-64 border rounded-xl p-1.5 shadow-lg"
    >
      {#if filterDimension}
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
            <span class="sr-only">Search {FILTER_LABELS[filterDimension]}</span>
            <SearchIcon
              class="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-fg-muted"
            />
            <input
              bind:value={filterSearch}
              {@attach focusOnMount}
              class="ld-input py-0 pr-2 pl-8"
              placeholder={FILTER_LABELS[filterDimension]}
            />
          </label>
        </div>
        <ul class="flex max-h-72 flex-col overflow-y-auto">
          {#each filterValues as value (value)}
            <li>
              <button
                type="button"
                class={[
                  MENU_ROW,
                  'hover:bg-surface-elevated-hover-bg cursor-pointer',
                ]}
                onclick={() => onPickValue(value)}
              >
                <span class="truncate">
                  {filterValueLabel(filterDimension, value)}
                </span>
              </button>
            </li>
          {:else}
            <li class="text-fg-muted px-2.5 py-2 text-sm">No values</li>
          {/each}
        </ul>
      {:else}
        <p class="text-fg-muted px-2.5 pt-1 pb-1.5 text-xs">Filter by</p>
        <ul class="flex flex-col">
          {#each Object.entries(FILTER_LABELS) as [dimension, label] (dimension)}
            <li>
              <button
                type="button"
                class={[
                  MENU_ROW,
                  'hover:bg-surface-elevated-hover-bg cursor-pointer',
                ]}
                onclick={(event) =>
                  onPickDimension(
                    event,
                    dimension as WebAnalyticsFilterDimension,
                  )}
              >
                {label}
                <ChevronRightIcon class="ml-auto size-3.5 text-fg-muted" />
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  </Dropdown>

  <Tooltip content="Refresh" placement="bottom">
    <button
      type="button"
      class={TOOLBAR_ICON_CONTROL}
      aria-label="Refresh"
      onclick={onrefresh}
    >
      <RefreshIcon class={['size-3.5', { 'animate-spin': loading }]} />
    </button>
  </Tooltip>
</div>
