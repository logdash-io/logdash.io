<script lang="ts">
  import { Tooltip } from '@logdash/hyper-ui/presentational';
  import UpgradeElement from '$lib/domains/shared/upgrade/UpgradeElement.svelte';
  import FilterIcon from '$lib/domains/shared/icons/FilterIcon.svelte';
  import ChevronRightIcon from '$lib/domains/shared/icons/ChevronRightIcon.svelte';
  import SveltyPicker from 'svelty-picker';
  import { filtersStore } from '$lib/domains/logs/infrastructure/filters.store.svelte.js';
  import type { LogLevel } from '$lib/domains/logs/domain/log-level';
  import { LOG_LEVELS } from '$lib/domains/logs/domain/log-level-metadata';
  import {
    TIME_RANGE_PRESETS,
    type TimeRangeValue,
    getDatesForTimeRange,
    formatTimeRangeLabel,
    isTimeRangeExceedingLimit,
    isCustomRangeExceedingLimit,
  } from '$lib/domains/logs/domain/time-range';
  import type { NamespaceMetadata } from '$lib/domains/logs/domain/namespace-metadata.js';
  import { LogsService } from '$lib/domains/logs/infrastructure/logs.service.js';
  import { onMount } from 'svelte';

  type Props = {
    maxDateRangeHours: number;
    projectId: string;
  };

  const { maxDateRangeHours, projectId }: Props = $props();

  let hoveredMenu = $state<'level' | 'time-range' | 'namespace' | null>(null);
  let availableNamespaces = $state<NamespaceMetadata[]>([]);
  let loadingNamespaces = $state(false);

  async function fetchNamespaces(): Promise<void> {
    if (loadingNamespaces) return;
    loadingNamespaces = true;
    try {
      availableNamespaces = await LogsService.getLogsNamespaces(projectId);
    } catch {
      availableNamespaces = [];
    } finally {
      loadingNamespaces = false;
    }
  }

  onMount(() => {
    fetchNamespaces();
  });
  let showCustomDatePicker = $state(false);
  let customStartDate = $state('');
  let customEndDate = $state('');

  const activeFilterCount = $derived.by(() => {
    let count = 0;
    if (filtersStore.levels.length > 0) count++;
    if (filtersStore.namespaces.length > 0) count++;
    if (filtersStore.startDate && filtersStore.endDate) count++;
    if (filtersStore.searchString?.trim()) count++;
    return count;
  });

  const hasActiveFilters = $derived(activeFilterCount > 0);

  const currentTimeRangeLabel = $derived(
    formatTimeRangeLabel(filtersStore.startDate, filtersStore.endDate),
  );

  const isCustomRangeUpgradeRequired = $derived(
    customStartDate &&
      customEndDate &&
      isCustomRangeExceedingLimit(
        customStartDate,
        customEndDate,
        maxDateRangeHours,
      ),
  );

  function onLevelToggle(level: LogLevel): void {
    filtersStore.toggleLevel(level);
  }

  function onLevelClick(
    e: MouseEvent,
    level: LogLevel,
    close: () => void,
  ): void {
    if (e.metaKey || e.shiftKey) {
      filtersStore.toggleLevel(level);
      return;
    }
    filtersStore.setLevels([level]);
    close();
  }

  function onNamespaceToggle(namespace: string): void {
    filtersStore.toggleNamespace(namespace);
  }

  function onNamespaceClick(
    e: MouseEvent,
    namespace: string,
    close: () => void,
  ): void {
    if (e.metaKey || e.shiftKey) {
      filtersStore.toggleNamespace(namespace);
      return;
    }
    filtersStore.setNamespaces([namespace]);
    close();
  }

  function onTimeRangeSelect(
    rangeValue: TimeRangeValue,
    close: () => void,
  ): void {
    if (rangeValue === 'custom') {
      showCustomDatePicker = true;
      return;
    }

    const { startDate, endDate } = getDatesForTimeRange(rangeValue);
    filtersStore.setFilters({ startDate, endDate });
    close();
  }

  function onCustomDateApply(close: () => void): void {
    if (!customStartDate || !customEndDate) return;

    filtersStore.setFilters({
      startDate: new Date(customStartDate).toISOString(),
      endDate: new Date(customEndDate).toISOString(),
    });
    showCustomDatePicker = false;
    close();
  }

  function onCustomDateCancel(): void {
    showCustomDatePicker = false;
    customStartDate = '';
    customEndDate = '';
  }
</script>

<Tooltip
  content={menu}
  interactive={true}
  placement="bottom"
  trigger="click"
  closeOnOutsideTooltipClick={true}
>
  <button
    class={[
      'fcc rounded-full p-1 px-2 gap-1.5 h-fit bg-base-300 border border-secondary/20 cursor-pointer hover:border-secondary/30',
    ]}
    data-posthog-id="logs-filter-dropdown"
  >
    <FilterIcon class="size-3.5" />
    <span class="hidden md:block text-sm">Filter</span>
  </button>
</Tooltip>

{#snippet levelSubmenu(close: () => void)}
  <div
    class="ld-card-base rounded-box absolute -top-2 left-full z-50 w-fit whitespace-nowrap p-1.5 shadow-lg"
    onmouseenter={() => (hoveredMenu = 'level')}
  >
    <ul class="dropdown-content p-0">
      {#each LOG_LEVELS as level}
        {@const isSelected = filtersStore.hasLevel(level.value)}
        <li>
          <div
            class={[
              'hover:bg-base-100 group flex w-full items-center gap-1.5 rounded-lg px-3 py-1.5',
              { 'bg-base-100': isSelected },
            ]}
          >
            <label
              class="flex cursor-pointer items-center"
              onclick={(e: MouseEvent) => e.stopPropagation()}
            >
              <input
                type="checkbox"
                class="checkbox checkbox-xs"
                checked={isSelected}
                onchange={() => onLevelToggle(level.value)}
              />
            </label>
            <button
              class="flex flex-1 cursor-pointer items-center gap-2 text-left"
              onclick={(e: MouseEvent) => onLevelClick(e, level.value, close)}
            >
              <span class={['h-2 w-2 rounded-full', level.color]}></span>
              <span>{level.label}</span>
            </button>
          </div>
        </li>
      {/each}
      {#if filtersStore.levels.length > 0}
        <li class="border-base-100 mt-1 border-t pt-1">
          <button
            class="hover:bg-base-100 text-base-content/60 w-full rounded-lg px-3 py-1.5 text-left text-xs"
            onclick={() => filtersStore.setLevels([])}
          >
            Clear all levels
          </button>
        </li>
      {/if}
    </ul>
  </div>
{/snippet}

{#snippet timeRangeSubmenu(close: () => void)}
  <div
    class="ld-card-base rounded-box absolute -top-2 left-full z-50 w-56 whitespace-nowrap p-1.5 shadow-lg"
    onmouseenter={() => (hoveredMenu = 'time-range')}
  >
    <ul class="p-0">
      {#each TIME_RANGE_PRESETS as range}
        {@const requiresUpgrade = isTimeRangeExceedingLimit(
          range.hours,
          maxDateRangeHours,
        )}
        <li>
          <UpgradeElement
            class={[
              'hover:bg-base-100 flex w-full items-center justify-between gap-4 rounded-lg px-3 py-1.5 text-left',
              { 'bg-base-100': currentTimeRangeLabel === range.label },
            ]}
            onclick={() => {
              if (requiresUpgrade) {
                close();
                return;
              }
              onTimeRangeSelect(range.value, close);
            }}
            enabled={requiresUpgrade}
            source="logs-date-range"
            interactive={true}
          >
            <span>{range.label}</span>
            {#if requiresUpgrade}
              <span class="badge badge-xs badge-primary badge-soft">
                Upgrade
              </span>
            {/if}
          </UpgradeElement>
        </li>
      {/each}
    </ul>
  </div>
{/snippet}

{#snippet namespaceSubmenu(close: () => void)}
  <div
    class="ld-card-base rounded-box absolute -top-2 left-full z-50 w-fit whitespace-nowrap p-1 shadow-lg"
    onmouseenter={() => (hoveredMenu = 'namespace')}
  >
    <ul class="dropdown-content p-0">
      {#if loadingNamespaces}
        <li class="px-3 py-1.5 text-base-content/60">Loading...</li>
      {:else if availableNamespaces.length === 0}
        <li class="px-3 py-1.5 text-base-content/60">No namespaces</li>
      {:else}
        {#each availableNamespaces as nsMetadata}
          {@const isSelected = filtersStore.hasNamespace(nsMetadata.namespace)}
          <li>
            <div
              class={[
                'hover:bg-base-100 group flex w-full items-center gap-1.5 rounded-lg px-3 py-1.5',
                { 'bg-base-100': isSelected },
              ]}
            >
              <label
                class="flex cursor-pointer items-center"
                onclick={(e: MouseEvent) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  class="checkbox checkbox-xs"
                  checked={isSelected}
                  onchange={() => onNamespaceToggle(nsMetadata.namespace)}
                />
              </label>
              <button
                class="flex flex-1 cursor-pointer items-center gap-2 text-left"
                onclick={(e: MouseEvent) =>
                  onNamespaceClick(e, nsMetadata.namespace, close)}
              >
                <span>{nsMetadata.namespace}</span>
              </button>
            </div>
          </li>
        {/each}
        {#if filtersStore.namespaces.length > 0}
          <li class="border-base-100 mt-1 border-t pt-1">
            <button
              class="hover:bg-base-100 text-base-content/60 w-full rounded-lg px-3 py-1.5 text-left text-xs"
              onclick={() => filtersStore.setNamespaces([])}
            >
              Clear all namespaces
            </button>
          </li>
        {/if}
      {/if}
    </ul>
  </div>
{/snippet}

{#snippet customDatePickerContent(close: () => void)}
  <div class="w-56 space-y-3 p-2">
    <div class="text-sm font-medium">Custom Range</div>
    <div class="space-y-2">
      <div class="space-y-1">
        <label class="text-base-content/70 block text-xs">From</label>
        <SveltyPicker
          bind:value={customStartDate}
          mode="datetime"
          placeholder="Start date"
          inputClasses="ld-input ld-input-padding w-full text-xs"
          displayFormat={'yyyy M dd, hh:ii'}
        />
      </div>
      <div class="space-y-1">
        <label class="text-base-content/70 block text-xs">To</label>
        <SveltyPicker
          bind:value={customEndDate}
          mode="datetime"
          placeholder="End date"
          inputClasses="ld-input ld-input-padding w-full text-xs"
          displayFormat={'yyyy M dd, hh:ii'}
        />
      </div>
    </div>
    <div class="flex gap-2">
      <button
        class="btn btn-secondary btn-xs flex-1"
        onclick={onCustomDateCancel}
      >
        Cancel
      </button>
      <UpgradeElement
        enabled={isCustomRangeUpgradeRequired}
        source="logs-filter-dropdown"
        class={[
          'btn btn-xs flex-1',
          {
            'btn-primary': customStartDate && customEndDate,
            'btn-secondary-disabled': !customStartDate || !customEndDate,
          },
        ]}
        interactive={Boolean(customStartDate && customEndDate)}
        onclick={() => onCustomDateApply(close)}
      >
        Apply
      </UpgradeElement>
    </div>
  </div>
{/snippet}

{#snippet menu(close: () => void)}
  <div
    class="fixed inset-0 z-[-1]"
    onmousedown={close}
    role="button"
    tabindex="-1"
  ></div>
  <div
    class="dropdown-content text-secondary ld-card-base z-1 w-fit rounded-2xl p-0.5 shadow"
  >
    {#if showCustomDatePicker}
      {@render customDatePickerContent(close)}
    {:else}
      <ul class="dropdown-content w-fit whitespace-nowrap p-1 text-sm">
        <li
          class="relative"
          onmouseenter={() => (hoveredMenu = 'level')}
          onmouseleave={() => (hoveredMenu = null)}
        >
          <div
            class={[
              'flex w-full cursor-pointer items-center justify-between gap-6 rounded-xl px-3 py-2',
              { 'bg-base-100': hoveredMenu === 'level' },
            ]}
          >
            <span class="flex items-center gap-2">
              <span>Level</span>
              {#if filtersStore.levels.length > 0}
                <span class="badge badge-xs badge-secondary badge-soft">
                  {filtersStore.levels.length}
                </span>
              {/if}
            </span>
            <ChevronRightIcon class="h-4 w-4 opacity-50" />
          </div>
          {#if hoveredMenu === 'level'}
            {@render levelSubmenu(close)}
          {/if}
        </li>

        <li
          class="relative"
          onmouseenter={() => (hoveredMenu = 'time-range')}
          onmouseleave={() => (hoveredMenu = null)}
        >
          <div
            class={[
              'flex w-full cursor-pointer items-center justify-between gap-6 rounded-lg px-3 py-2',
              { 'bg-base-100': hoveredMenu === 'time-range' },
            ]}
          >
            <span>Time Range</span>
            <ChevronRightIcon class="h-4 w-4 opacity-50" />
          </div>
          {#if hoveredMenu === 'time-range'}
            {@render timeRangeSubmenu(close)}
          {/if}
        </li>

        <li
          class="relative"
          onmouseenter={() => (hoveredMenu = 'namespace')}
          onmouseleave={() => (hoveredMenu = null)}
        >
          <div
            class={[
              'flex w-full cursor-pointer items-center justify-between gap-6 rounded-xl px-3 py-2',
              { 'bg-base-100': hoveredMenu === 'namespace' },
            ]}
          >
            <span class="flex items-center gap-2">
              <span>Namespace</span>
              {#if filtersStore.namespaces.length > 0}
                <span class="badge badge-xs badge-primary badge-soft">
                  {filtersStore.namespaces.length}
                </span>
              {/if}
            </span>
            <ChevronRightIcon class="h-4 w-4 opacity-50" />
          </div>
          {#if hoveredMenu === 'namespace'}
            {@render namespaceSubmenu(close)}
          {/if}
        </li>
      </ul>
    {/if}
  </div>
{/snippet}
