<script lang="ts">
  import { logsState } from '$lib/domains/logs/application/logs.state.svelte.js';
  import PauseCircleIcon from '$lib/domains/shared/icons/PauseCircleIcon.svelte';
  import { ClockIcon } from '@logdash/hyper-ui/icons';
  import LogsAnalyticsChart from './LogsAnalyticsChart.svelte';
  import LogsSearchInput from './LogsSearchInput.svelte';
  import LogsFilterDropdown from './filters/LogsFilterDropdown.svelte';
  import LogsFilterChips from './filters/LogsFilterChips.svelte';
  import { Button, Spinner, Tooltip } from '@logdash/hyper-ui/presentational';
  import { exposedConfigState } from '$lib/domains/shared/exposed-config/application/exposed-config.state.svelte.js';
  import { userState } from '$lib/domains/shared/user/application/user.state.svelte.js';
  import { filtersStore } from '$lib/domains/logs/infrastructure/filters.store.svelte.js';
  import { timeDisplayState } from '$lib/domains/logs/infrastructure/time-display.state.svelte.js';

  type Props = {
    projectId?: string;
  };

  const { projectId }: Props = $props();

  const maxRetentionHours = $derived(
    exposedConfigState.logRetentionHours(userState.tier),
  );

  function onSearchChange(query: string): void {
    filtersStore.setFilters({ searchString: query });
  }

  function onDateRangeChange(startDate: Date | null, endDate: Date | null) {
    filtersStore.setFilters({
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
    });
  }
</script>

<div class="flex flex-col">
  {#if projectId}
    <LogsAnalyticsChart
      bind:selectedStartDate={filtersStore.startDate}
      bind:selectedEndDate={filtersStore.endDate}
      {onDateRangeChange}
    />
  {/if}

  <div class="flex items-center justify-between gap-2.5 p-4">
    <LogsSearchInput {onSearchChange} />

    <Tooltip
      content={timeDisplayState.isRelative ? 'Relative time' : 'Absolute time'}
      placement="top"
    >
      <Button
        variant="ghost"
        size="xs"
        class="gap-1 px-1.5"
        onclick={() => timeDisplayState.toggle()}
      >
        <ClockIcon class="size-3.5 shrink-0" />
        <span class="text-neutral-400 font-mono text-xs">
          {timeDisplayState.isRelative ? 'REL' : 'ABS'}
        </span>
      </Button>
    </Tooltip>

    <Tooltip
      content={logsState.shouldFiltersBlockSync ? 'Sync paused' : 'Sync active'}
      placement="top"
    >
      <div class="flex size-4 shrink-0 items-center justify-center md:size-8">
        {#if logsState.shouldFiltersBlockSync}
          <PauseCircleIcon
            class="size-4 shrink-0 sm:h-5 sm:w-5"
            stroke="stroke-warning"
          />
        {:else}
          <div class="flex items-center gap-2">
            <Spinner variant="ring" size="sm" aria-label="Sync active" />
          </div>
        {/if}
      </div>
    </Tooltip>
  </div>

  <div class="flex flex-wrap gap-2 p-4 pt-0">
    <LogsFilterDropdown maxDateRangeHours={maxRetentionHours} />
    <LogsFilterChips />
  </div>
</div>
