<script lang="ts">
  import {
    LOG_LEVELS,
    LOG_LEVELS_MAP,
  } from '$lib/domains/logs/domain/log-level-metadata.js';
  import type { LogLevel } from '$lib/domains/logs/domain/log-level.js';
  import { formatTimeRangeLabel } from '$lib/domains/logs/domain/time-range.js';
  import { filtersStore } from '$lib/domains/logs/infrastructure/filters.store.svelte.js';
  import { namespacesState } from '$lib/domains/logs/infrastructure/namespaces.state.svelte.js';
  import { timeDisplayState } from '$lib/domains/logs/infrastructure/time-display.state.svelte.js';
  import { exposedConfigState } from '$lib/domains/shared/exposed-config/application/exposed-config.state.svelte.js';
  import { userState } from '$lib/domains/shared/user/application/user.state.svelte.js';
  import { Checkbox } from '@logdash/hyper-ui/presentational';
  import { untrack } from 'svelte';
  import LogsAnalyticsChart from './LogsAnalyticsChart.svelte';
  import LogsToolbar, { type LogsToolbarFilter } from './LogsToolbar.svelte';
  import LogsFilterDropdown from './filters/LogsFilterDropdown.svelte';

  type Props = {
    projectId?: string;
    volume?: boolean;
  };

  const { projectId, volume = false }: Props = $props();

  const SEARCH_DEBOUNCE_MS = 300;

  let search = $state(filtersStore.searchString);
  let searchTimer: ReturnType<typeof setTimeout> | undefined;

  const maxRetentionHours = $derived(
    exposedConfigState.logRetentionHours(userState.tier),
  );
  const timeRangeLabel = $derived(
    formatTimeRangeLabel(filtersStore.startDate, filtersStore.endDate),
  );

  const filters = $derived.by((): LogsToolbarFilter[] => {
    const levels = filtersStore.levels;
    const namespaces = filtersStore.namespaces;
    const result: LogsToolbarFilter[] = [];

    if (levels.length > 0) {
      result.push({
        key: 'level',
        label: 'Level',
        operator: levels.length > 1 ? 'is any of' : 'is',
        value:
          levels.length > 1
            ? `${levels.length} levels`
            : LOG_LEVELS_MAP[levels[0]].label,
        dots: levels.slice(0, 3).map((level) => LOG_LEVELS_MAP[level].color),
        menu: levelMenu,
        onClear: () => filtersStore.setLevels([]),
      });
    }

    if (namespaces.length > 0) {
      result.push({
        key: 'namespace',
        label: 'Namespace',
        operator: namespaces.length > 1 ? 'is any of' : 'is',
        value:
          namespaces.length > 1
            ? `${namespaces.length} namespaces`
            : namespaces[0],
        menu: namespaceMenu,
        onClear: () => filtersStore.setNamespaces([]),
      });
    }

    if (timeRangeLabel) {
      result.push({
        key: 'time',
        label: 'Time',
        operator: 'is',
        value: timeRangeLabel,
        onClear: () =>
          filtersStore.setFilters({ startDate: null, endDate: null }),
      });
    }

    return result;
  });

  $effect(() => {
    const stored = filtersStore.searchString;

    if (stored !== untrack(() => search).trim()) {
      search = stored;
    }
  });

  function onSearchInput(value: string): void {
    search = value;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      filtersStore.setFilters({ searchString: value.trim() });
    }, SEARCH_DEBOUNCE_MS);
  }

  function onSearchClear(): void {
    clearTimeout(searchTimer);
    search = '';
    filtersStore.setFilters({ searchString: '' });
  }

  function onQuickLevel(level: LogLevel): void {
    filtersStore.setLevels([level]);
  }

  function onLevelToggle(level: LogLevel): void {
    filtersStore.toggleLevel(level);
  }

  function onNamespaceToggle(namespace: string): void {
    filtersStore.toggleNamespace(namespace);
  }

  function onDateRangeChange(startDate: Date, endDate: Date): void {
    filtersStore.setFilters({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
  }
</script>

<div class="flex shrink-0 flex-col gap-4 p-4">
  <LogsToolbar
    {search}
    {filters}
    {filterMenu}
    relativeTime={timeDisplayState.isRelative}
    {onSearchInput}
    {onSearchClear}
    {onQuickLevel}
    onTimeToggle={() => timeDisplayState.toggle()}
  />

  {#if volume && projectId}
    <LogsAnalyticsChart {onDateRangeChange} />
  {/if}
</div>

{#snippet filterMenu(close: () => void)}
  <LogsFilterDropdown maxDateRangeHours={maxRetentionHours} {close} />
{/snippet}

{#snippet levelMenu(close: () => void)}
  {@render menuBackdrop(close)}
  <div
    class="bg-surface-elevated-bg border-surface-elevated-border rounded-xl border p-1 shadow-lg"
  >
    <div class="mb-1 px-3 py-1.5 text-sm font-medium">Level</div>
    <ul class="p-0">
      {#each LOG_LEVELS as level (level.value)}
        {@const isSelected = filtersStore.hasLevel(level.value)}
        <li>
          <label
            class={[
              'hover:bg-surface-elevated-hover-bg flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-sm',
              { 'bg-surface-elevated-selected-bg': isSelected },
            ]}
          >
            <Checkbox
              size="xs"
              checked={isSelected}
              onchange={() => onLevelToggle(level.value)}
            />
            <span class={['size-2 rounded-full', level.color]}></span>
            <span>{level.label}</span>
          </label>
        </li>
      {/each}
    </ul>
  </div>
{/snippet}

{#snippet namespaceMenu(close: () => void)}
  {@render menuBackdrop(close)}
  <div
    class="bg-surface-elevated-bg border-surface-elevated-border rounded-xl border p-1 shadow-lg"
  >
    <div class="mb-1 px-3 py-1.5 text-sm font-medium">Namespace</div>
    <ul class="p-0">
      {#each namespacesState.namespaces as { namespace } (namespace)}
        {@const isSelected = filtersStore.hasNamespace(namespace)}
        <li>
          <label
            class={[
              'hover:bg-surface-elevated-hover-bg flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-sm',
              { 'bg-surface-elevated-selected-bg': isSelected },
            ]}
          >
            <Checkbox
              size="xs"
              checked={isSelected}
              onchange={() => onNamespaceToggle(namespace)}
            />
            <span>{namespace}</span>
          </label>
        </li>
      {/each}
    </ul>
  </div>
{/snippet}

{#snippet menuBackdrop(close: () => void)}
  <div
    class="fixed inset-0 z-[-1]"
    onmousedown={close}
    role="button"
    tabindex="-1"
  ></div>
{/snippet}
