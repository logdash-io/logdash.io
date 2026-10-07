<script lang="ts" module>
  import type { Snippet } from 'svelte';

  export type LogsToolbarFilter = {
    key: string;
    label: string;
    operator: string;
    value: string;
    dots?: string[];
    menu?: Snippet<[close: () => void]>;
    onClear?: () => void;
  };

  export type LogsQuickLevel = 'error' | 'warning';
</script>

<script lang="ts">
  import { LOG_LEVELS_MAP } from '$lib/domains/logs/domain/log-level-metadata.js';
  import FilterIcon from '$lib/domains/shared/icons/FilterIcon.svelte';
  import SearchIcon from '$lib/domains/shared/icons/SearchIcon.svelte';
  import {
    TOOLBAR_CONTROL,
    TOOLBAR_ICON_CONTROL,
  } from '$lib/domains/shared/ui/components/toolbar.js';
  import { ClockIcon, CloseIcon } from '@logdash/hyper-ui/icons';
  import { Tooltip } from '@logdash/hyper-ui/presentational';

  type Props = {
    search?: string;
    filters?: LogsToolbarFilter[];
    interactive?: boolean;
    relativeTime?: boolean;
    filterMenu?: Snippet<[close: () => void]>;
    onSearchInput?: (value: string) => void;
    onSearchClear?: () => void;
    onQuickLevel?: (level: LogsQuickLevel) => void;
    onTimeToggle?: () => void;
  };

  const {
    search = '',
    filters = [],
    interactive = true,
    relativeTime = false,
    filterMenu,
    onSearchInput,
    onSearchClear,
    onQuickLevel,
    onTimeToggle,
  }: Props = $props();

  const CHIP_CLASS =
    'text-fg-tertiary flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm edge';
  const QUICK_LEVELS: {
    level: LogsQuickLevel;
    label: string;
    class?: string;
  }[] = [
    { level: 'error', label: 'Errors' },
    { level: 'warning', label: 'Warnings', class: 'max-sm:hidden' },
  ];
</script>

<div
  class="flex flex-wrap items-center gap-2"
  inert={!interactive}
  aria-hidden={interactive ? undefined : 'true'}
>
  <label
    class="focus-within:inset-ring-surface-input-hover-border flex h-8 min-w-24 flex-1 items-center gap-2 rounded-full px-3 text-sm edge focus-within:inset-ring"
  >
    <SearchIcon class="text-fg-faint size-3.5 shrink-0" />
    <input
      type="text"
      value={search}
      placeholder="Search logs"
      aria-label="Search logs"
      class="placeholder:text-fg-faint h-full min-w-0 flex-1 bg-transparent outline-none"
      oninput={(event) => onSearchInput?.(event.currentTarget.value)}
    />
    {#if search}
      <button
        type="button"
        aria-label="Clear search"
        class="text-fg-muted hover:text-fg-default transition-ink focus-visible:outline-brand -mr-2 flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full focus-visible:outline-2"
        onclick={onSearchClear}
      >
        <CloseIcon class="size-3.5" />
      </button>
    {/if}
  </label>

  {#if filterMenu}
    <Tooltip
      content={filterMenu}
      interactive={true}
      placement="bottom"
      trigger="click"
      closeOnOutsideTooltipClick={true}
    >
      {@render filterChip()}
    </Tooltip>
  {:else}
    {@render filterChip()}
  {/if}

  {#if filters.length === 0}
    {#each QUICK_LEVELS as quick (quick.level)}
      <button
        type="button"
        class={[TOOLBAR_CONTROL, 'text-fg-tertiary', quick.class]}
        onclick={() => onQuickLevel?.(quick.level)}
      >
        <span
          class={['size-1.5 rounded-full', LOG_LEVELS_MAP[quick.level].color]}
        ></span>
        {quick.label}
      </button>
    {/each}
  {/if}

  {#if onTimeToggle}
    <Tooltip
      content={relativeTime ? 'Show exact times' : 'Show relative times'}
      placement="top"
    >
      <button
        type="button"
        aria-label={relativeTime ? 'Show exact times' : 'Show relative times'}
        class={TOOLBAR_ICON_CONTROL}
        onclick={onTimeToggle}
      >
        <ClockIcon class="size-3.5 shrink-0" />
      </button>
    </Tooltip>
  {/if}

  {#if filters.length > 0}
    <div class="flex basis-full flex-wrap items-center gap-2">
      {#each filters as filter (filter.key)}
        <span class={[CHIP_CLASS, 'pr-1']}>
          <span class="text-fg-muted whitespace-nowrap">
            {filter.label}
            {filter.operator}
          </span>

          {#if filter.menu}
            <Tooltip
              content={filter.menu}
              interactive={true}
              placement="bottom"
              trigger="click"
              closeOnOutsideTooltipClick={true}
            >
              <button
                type="button"
                class="text-fg-default flex cursor-pointer items-center gap-1.5 whitespace-nowrap"
              >
                {@render filterValue(filter)}
              </button>
            </Tooltip>
          {:else}
            <span
              class="text-fg-default flex items-center gap-1.5 whitespace-nowrap"
            >
              {@render filterValue(filter)}
            </span>
          {/if}

          {#if filter.onClear}
            <button
              type="button"
              aria-label="Clear {filter.label.toLowerCase()} filter"
              class="text-fg-muted hover:bg-surface-25-hover-bg hover:text-fg-default focus-visible:outline-brand flex size-6 cursor-pointer items-center justify-center rounded-full focus-visible:outline-2"
              onclick={filter.onClear}
            >
              <CloseIcon class="size-3.5" />
            </button>
          {/if}
        </span>
      {/each}
    </div>
  {/if}
</div>

{#snippet filterChip()}
  <button
    type="button"
    class={[TOOLBAR_CONTROL, 'text-fg-tertiary']}
    data-posthog-id="logs-filter-dropdown"
  >
    <FilterIcon class="size-3.5 shrink-0" />
    Filter
  </button>
{/snippet}

{#snippet filterValue(filter: LogsToolbarFilter)}
  {#if filter.dots?.length}
    <span class="flex items-center">
      {#each filter.dots as dot, index (index)}
        <span
          class={[
            'ring-surface-25-bg size-1.5 rounded-full ring-2',
            { '-ml-0.5': index > 0 },
            dot,
          ]}
        ></span>
      {/each}
    </span>
  {/if}
  {filter.value}
{/snippet}
