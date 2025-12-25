<script lang="ts">
  import { Tooltip } from '@logdash/hyper-ui/presentational';
  import { CloseIcon } from '@logdash/hyper-ui/icons';
  import { filtersStore } from '$lib/domains/logs/infrastructure/filters.store.svelte.js';
  import type { LogLevel } from '$lib/domains/logs/domain/log-level';
  import {
    LOG_LEVELS,
    LOG_LEVELS_MAP,
  } from '$lib/domains/logs/domain/log-level-metadata';
  import { formatTimeRangeLabel } from '$lib/domains/logs/domain/time-range';

  function onLevelToggle(level: LogLevel): void {
    filtersStore.toggleLevel(level);
  }

  function onClearLevels(e: MouseEvent): void {
    e.stopPropagation();
    e.preventDefault();
    filtersStore.setLevels([]);
  }

  function onClearTimeRange(e: MouseEvent): void {
    e.stopPropagation();
    e.preventDefault();
    filtersStore.setFilters({ startDate: null, endDate: null });
  }

  function onNamespaceToggle(namespace: string): void {
    filtersStore.toggleNamespace(namespace);
  }

  function onClearNamespaces(e: MouseEvent): void {
    e.stopPropagation();
    e.preventDefault();
    filtersStore.setNamespaces([]);
  }

  const timeRangeLabel = $derived(
    formatTimeRangeLabel(filtersStore.startDate, filtersStore.endDate),
  );

  const hasLevels = $derived(filtersStore.levels.length > 0);
  const isMultipleLevels = $derived(filtersStore.levels.length > 1);
  const hasNamespaces = $derived(filtersStore.namespaces.length > 0);
  const isMultipleNamespaces = $derived(filtersStore.namespaces.length > 1);
  const hasActiveFilters = $derived(
    hasLevels || hasNamespaces || timeRangeLabel,
  );

  const FILTER_CHIP_CLASS =
    'bg-base-300 border-secondary/20 flex items-center gap-1.5 rounded-full border py-1 pr-1 pl-2.5 text-sm';

  function onQuickFilterErrors(): void {
    filtersStore.setLevels(['error']);
  }

  function onQuickFilterWarnings(): void {
    filtersStore.setLevels(['warning']);
  }
</script>

{#if !hasActiveFilters}
  <div class="flex items-center gap-2">
    <button
      class="whitespace-nowrap bg-base-300 text-base-content/60 hover:text-base-content border-base-content/30 flex items-center gap-1.5 rounded-full border border-dashed py-1 px-2.5 text-sm transition-colors cursor-pointer"
      onclick={onQuickFilterErrors}
    >
      <span
        class={['h-2 w-2 rounded-full', LOG_LEVELS_MAP['error'].color]}
      ></span>
      <span>Filter only errors</span>
    </button>

    <button
      class="whitespace-nowrap bg-base-300 text-base-content/60 hover:text-base-content border-base-content/30 flex items-center gap-1.5 rounded-full border border-dashed py-1 px-2.5 text-sm transition-colors cursor-pointer"
      onclick={onQuickFilterWarnings}
    >
      <span
        class={['h-2 w-2 rounded-full', LOG_LEVELS_MAP['warning'].color]}
      ></span>
      <span>Filter only warnings</span>
    </button>
  </div>
{/if}

{#if hasActiveFilters}
  <div class="flex flex-wrap items-center gap-2">
    {#if hasLevels}
      <div class={FILTER_CHIP_CLASS}>
        <span class="text-base-content/70">Level</span>
        <span class="font-medium">
          {isMultipleLevels ? 'is any of' : 'is'}
        </span>
        <Tooltip
          content={levelSelectionMenu}
          interactive={true}
          placement="bottom"
          trigger="click"
          closeOnOutsideTooltipClick={true}
        >
          <span class="flex items-center gap-1.5 cursor-pointer select-none">
            {@render levelChipContent()}
          </span>
        </Tooltip>
        {@render clearButton(onClearLevels)}
      </div>
    {/if}

    {#if hasNamespaces}
      <div class={FILTER_CHIP_CLASS}>
        <span class="text-base-content/70">Namespace</span>
        <span class="font-medium">
          {isMultipleNamespaces ? 'is any of' : 'is'}
        </span>
        <Tooltip
          content={namespaceSelectionMenu}
          interactive={true}
          placement="bottom"
          trigger="click"
          closeOnOutsideTooltipClick={true}
        >
          <span class="flex items-center gap-1.5 cursor-pointer select-none">
            {@render namespaceChipContent()}
          </span>
        </Tooltip>
        {@render clearButton(onClearNamespaces)}
      </div>
    {/if}

    {#if timeRangeLabel}
      <div class={FILTER_CHIP_CLASS}>
        <span class="text-base-content/70">Time</span>
        <span class="font-medium">is</span>
        <span class="font-medium">{timeRangeLabel}</span>
        {@render clearButton(onClearTimeRange)}
      </div>
    {/if}
  </div>
{/if}

{#snippet levelSelectionMenu(close: () => void)}
  <div
    class="fixed inset-0 z-[-1]"
    onmousedown={close}
    role="button"
    tabindex="-1"
  ></div>
  <div class="ld-card-base rounded-2xl p-1 shadow-lg">
    <div class="mb-1 px-3 py-1.5 text-sm font-medium">Level</div>
    <ul class="dropdown-content p-0">
      {#each LOG_LEVELS as level}
        {@const isSelected = filtersStore.hasLevel(level.value)}
        <li>
          <label
            class={[
              'hover:bg-base-100 flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5',
              { 'bg-base-100': isSelected },
            ]}
          >
            <input
              type="checkbox"
              class="checkbox checkbox-xs"
              checked={isSelected}
              onchange={() => onLevelToggle(level.value)}
            />
            <span class={['h-2 w-2 rounded-full', level.color]}></span>
            <span>{level.label}</span>
          </label>
        </li>
      {/each}
    </ul>
  </div>
{/snippet}

{#snippet levelChipContent()}
  {#if isMultipleLevels}
    <span class="flex items-center gap-0.5">
      {#each filtersStore.levels.slice(0, 3) as level, index}
        {@const levelInfo = LOG_LEVELS_MAP[level]}
        {#if levelInfo}
          <span
            class={[
              'h-2 w-2 rounded-full ring ring-base-300',
              {
                '-ml-0.5': index > 0,
              },
              levelInfo.color,
            ]}
          ></span>
        {/if}
      {/each}
    </span>
    <span class="font-medium">{filtersStore.levels.length} levels</span>
  {:else}
    {@const levelInfo = LOG_LEVELS_MAP[filtersStore.levels[0]]}
    {#if levelInfo}
      <span class={['h-2 w-2 rounded-full', levelInfo.color]}></span>
      <span class="font-medium">{levelInfo.label}</span>
    {/if}
  {/if}
{/snippet}

{#snippet namespaceSelectionMenu(close: () => void)}
  <div
    class="fixed inset-0 z-[-1]"
    onmousedown={close}
    role="button"
    tabindex="-1"
  ></div>
  <div class="ld-card-base rounded-2xl p-1 shadow-lg">
    <div class="mb-1 px-3 py-1.5 text-sm font-medium">Namespace</div>
    <ul class="dropdown-content p-0">
      {#each filtersStore.namespaces as namespace}
        <li>
          <label
            class="hover:bg-base-100 bg-base-100 flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5"
          >
            <input
              type="checkbox"
              class="checkbox checkbox-xs"
              checked={true}
              onchange={() => onNamespaceToggle(namespace)}
            />
            <span>{namespace}</span>
          </label>
        </li>
      {/each}
    </ul>
  </div>
{/snippet}

{#snippet namespaceChipContent()}
  {#if isMultipleNamespaces}
    <span class="font-medium">{filtersStore.namespaces.length} namespaces</span>
  {:else}
    <span class="font-medium">{filtersStore.namespaces[0]}</span>
  {/if}
{/snippet}

{#snippet clearButton(onClick: (e: MouseEvent) => void)}
  <span
    class="hover:bg-base-content/10 ml-0.5 rounded-full p-0.5 transition-colors cursor-pointer"
    role="button"
    tabindex="0"
    onclick={onClick}
  >
    <CloseIcon class="size-3.5" />
  </span>
{/snippet}
