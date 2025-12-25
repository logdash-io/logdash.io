<script lang="ts">
  import { page } from '$app/state';
  import { logsState } from '$lib/domains/logs/application/logs.state.svelte.js';
  import PauseCircleIcon from '$lib/domains/shared/icons/PauseCircleIcon.svelte';
  import { ClockIcon } from '@logdash/hyper-ui/icons';
  import { scale } from 'svelte/transition';
  import LogsAnalyticsChart from './LogsAnalyticsChart.svelte';
  import LogsSearchInput from './LogsSearchInput.svelte';
  import LogsFilterDropdown from './filters/LogsFilterDropdown.svelte';
  import LogsFilterChips from './filters/LogsFilterChips.svelte';
  import { Tooltip } from '@logdash/hyper-ui/presentational';
  import { exposedConfigState } from '$lib/domains/shared/exposed-config/application/exposed-config.state.svelte.js';
  import { userState } from '$lib/domains/shared/user/application/user.state.svelte.js';
  import { filtersStore } from '$lib/domains/logs/infrastructure/filters.store.svelte.js';
  import { timeDisplayState } from '$lib/domains/logs/infrastructure/time-display.state.svelte.js';

  type Props = {
    projectId: string;
  };

  const { projectId }: Props = $props();

  const isOnDemoDashboard = $derived(
    page.url.pathname.includes('/demo-dashboard'),
  );

  const maxRetentionHours = $derived(
    exposedConfigState.logRetentionHours(userState.tier),
  );

  let sendingTestLogCooldown = $state(0);

  function sendTestLog(): void {
    sendingTestLogCooldown = 5;
    const interval = setInterval(() => {
      sendingTestLogCooldown--;
      if (sendingTestLogCooldown < 1) {
        clearInterval(interval);
      }
    }, 1000);
    logsState.sendTestLog(projectId);
  }

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

    {#if isOnDemoDashboard}
      <button
        class="btn btn-secondary btn-sm gap-1.5"
        data-posthog-id="send-test-log-button"
        disabled={sendingTestLogCooldown > 0}
        onclick={sendTestLog}
      >
        <span>Send test log</span>
        {#if sendingTestLogCooldown > 0}
          <span
            class="font-mono"
            in:scale|global={{ start: 0.8, duration: 200 }}
          >
            ({sendingTestLogCooldown}s)
          </span>
        {/if}
      </button>
    {/if}

    <Tooltip
      content={timeDisplayState.isRelative ? 'Relative time' : 'Absolute time'}
      placement="top"
    >
      <button
        class="btn btn-ghost btn-xs gap-1 px-1.5"
        onclick={() => timeDisplayState.toggle()}
      >
        <ClockIcon class="size-3.5 shrink-0" />
        <span class="text-xs font-mono opacity-70">
          {timeDisplayState.isRelative ? 'REL' : 'ABS'}
        </span>
      </button>
    </Tooltip>

    <Tooltip
      content={logsState.shouldFiltersBlockSync ? 'Sync paused' : 'Sync active'}
      placement="top"
    >
      <div class="flex size-4 shrink-0 items-center justify-center md:size-8">
        {#if logsState.shouldFiltersBlockSync}
          <PauseCircleIcon
            class="size-4 shrink-0 sm:h-5 sm:w-5"
            stroke="stroke-warning-content"
          />
        {:else}
          <div class="flex items-center gap-2">
            <span class="loading loading-ring loading-sm"></span>
          </div>
        {/if}
      </div>
    </Tooltip>
  </div>

  <div class="flex flex-wrap gap-2 p-4 pt-0">
    <LogsFilterDropdown maxDateRangeHours={maxRetentionHours} {projectId} />
    <LogsFilterChips />
  </div>
</div>
