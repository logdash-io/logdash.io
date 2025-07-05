<script lang="ts">
  import { logAnalyticsState } from '$lib/domains/logs/application/log-analytics.state.svelte.js';
  import { logsState } from '$lib/domains/logs/application/logs.state.svelte.js';
  import PauseCircleIcon from '$lib/domains/shared/icons/PauseCircleIcon.svelte';
  import { scale } from 'svelte/transition';
  import LogsAnalyticsChart from './LogsAnalyticsChart.svelte';
  import LogsSearchInput from './LogsSearchInput.svelte';
  import LogsFilterDropdown from './LogsFilterDropdown.svelte';

  type Props = {
    projectId: string;
  };

  const { projectId }: Props = $props();

  let sendingTestLogCooldown = $state(0);
  let selectedDateRange = $state<{ start: Date; end: Date } | null>(null);

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
    logsState.setFilters({ searchString: query });
  }

  function onDateRangeChange(startDate: Date | null, endDate: Date | null) {
    selectedDateRange = { start: startDate, end: endDate };
    logsState.setFilters({
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
    });
  }

  async function fetchAnalyticsData(timeRange?: {
    start: Date;
    end: Date;
  }): Promise<void> {
    if (!projectId) return;

    try {
      const now = new Date();
      const endTime = timeRange?.end || now;
      const startTime =
        timeRange?.start || new Date(now.getTime() - 24 * 60 * 60 * 1000);

      await logAnalyticsState.fetchAnalytics(
        projectId,
        startTime.toISOString(),
        endTime.toISOString(),
        0, // UTC offset, can be made configurable
      );
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
      // The error will be handled by the state and displayed in the UI
    }
  }

  $effect(() => {
    fetchAnalyticsData(selectedDateRange);
  });
</script>

<div class="flex flex-col">
  {#if projectId}
    <LogsAnalyticsChart bind:selectedDateRange {onDateRangeChange} />
  {/if}

  <div class="flex items-center justify-between gap-2.5 p-4">
    <div class="flex h-8 w-8 shrink-0 items-center justify-center">
      {#if logsState.syncPaused}
        <PauseCircleIcon
          class="h-5 w-5 shrink-0"
          stroke="stroke-warning-content"
        />
      {:else}
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2">
            <span class="loading loading-ring loading-sm"></span>
          </div>
        </div>
      {/if}
    </div>

    <LogsSearchInput {onSearchChange} />

    <LogsFilterDropdown
      selectedLevel={logsState.filters.level}
      selectedStartDate={logsState.filters.startDate}
      selectedEndDate={logsState.filters.endDate}
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
