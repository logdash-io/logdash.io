<script lang="ts">
  import { logsState } from '$lib/domains/logs/application/logs.state.svelte.js';
  import PauseCircleIcon from '$lib/domains/shared/icons/PauseCircleIcon.svelte';
  import { scale } from 'svelte/transition';
  import LogsAnalyticsChart from './LogsAnalyticsChart.svelte';
  import LogsSearchInput from './LogsSearchInput.svelte';
  import LogsFilterDropdown from './filters/LogsFilterDropdown.svelte';
  import Tooltip from '$lib/domains/shared/ui/components/Tooltip.svelte';
  import { exposedConfigState } from '$lib/domains/shared/exposed-config/application/exposed-config.state.svelte.js';
  import { userState } from '$lib/domains/shared/user/application/user.state.svelte.js';
  import { filtersStore } from '$lib/domains/logs/infrastructure/filters.store.svelte.js';

  type Props = {
    projectId: string;
  };

  const { projectId }: Props = $props();

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
    <Tooltip
      content={logsState.syncPaused ? 'Sync paused' : 'Sync active'}
      placement="top"
    >
      <div
        class="flex h-3 w-3 shrink-0 items-center justify-center md:h-8 md:w-8"
      >
        {#if logsState.syncPaused}
          <PauseCircleIcon
            class="h-3 w-3 shrink-0"
            stroke="stroke-warning-content"
          />
        {:else}
          <div class="flex items-center gap-2">
            <span class="loading loading-ring loading-sm"></span>
          </div>
        {/if}
      </div>
    </Tooltip>

    <LogsSearchInput {onSearchChange} />

    <LogsFilterDropdown
      bind:selectedLevel={filtersStore.level}
      bind:selectedStartDate={filtersStore.startDate}
      bind:selectedEndDate={filtersStore.endDate}
      searchString={filtersStore.searchString}
      maxDateRangeHours={maxRetentionHours}
      onClearAllClicked={() => {
        filtersStore.reset();
      }}
    />

    <button
      class="btn btn-primary btn-sm gap-1.5"
      data-posthog-id="send-test-log-button"
      disabled={sendingTestLogCooldown > 0}
      onclick={sendTestLog}
    >
      <span>Send test log</span>
      {#if sendingTestLogCooldown > 0}
        <span class="font-mono" in:scale|global={{ start: 0.8, duration: 200 }}>
          ({sendingTestLogCooldown}s)
        </span>
      {/if}
    </button>
  </div>
</div>
