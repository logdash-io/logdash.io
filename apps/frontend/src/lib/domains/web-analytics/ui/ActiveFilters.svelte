<script lang="ts">
  import { CloseIcon } from '@logdash/hyper-ui/icons';
  import {
    FILTER_LABELS,
    type AnalyticsQuery,
  } from '../domain/analytics-query';
  import { filterValueLabel } from '../domain/analytics-format';
  import type { WebAnalyticsFilter } from '../domain/web-analytics';

  type Props = {
    query: AnalyticsQuery;
    onchange: (query: AnalyticsQuery) => void;
  };

  const { query, onchange }: Props = $props();

  function onRemove(filter: WebAnalyticsFilter): void {
    onchange({
      ...query,
      filters: query.filters.filter(
        (entry) => entry.dimension !== filter.dimension,
      ),
    });
  }

  function onClear(): void {
    onchange({ ...query, filters: [] });
  }
</script>

<ul class="flex flex-wrap items-center gap-2" aria-label="Active filters">
  {#each query.filters as filter (filter.dimension)}
    <li
      class="border-surface-100-border bg-surface-100-bg flex h-8 max-w-full items-center gap-1.5 rounded-lg border pr-1 pl-3 text-sm"
    >
      <span class="text-fg-muted shrink-0">
        {FILTER_LABELS[filter.dimension]} is
      </span>
      <span class="truncate font-medium">
        {filterValueLabel(filter.dimension, filter.value)}
      </span>
      <button
        type="button"
        class="hover:bg-surface-100-hover-bg hover:text-fg-default transition-ink flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-fg-muted"
        aria-label="Remove filter {FILTER_LABELS[filter.dimension]}"
        onclick={() => onRemove(filter)}
      >
        <CloseIcon class="size-3.5" />
      </button>
    </li>
  {/each}
  {#if query.filters.length > 1}
    <li>
      <button
        type="button"
        class="text-fg-muted hover:text-fg-default transition-ink h-8 cursor-pointer px-2 text-sm"
        onclick={onClear}
      >
        Clear all
      </button>
    </li>
  {/if}
</ul>
