<script lang="ts">
  import { logsState } from '$lib/domains/logs/application/logs.state.svelte.js';
  import { scale } from 'svelte/transition';
  import LogsSearchInput from './LogsSearchInput.svelte';
  import LogsAnalyticsChart from './LogsAnalyticsChart.svelte';
  import { logAnalyticsState } from '$lib/domains/logs/application/log-analytics.state.svelte.js';
  import { onMount } from 'svelte';

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

  <div class="bg-base-300 flex items-center justify-between gap-2.5 p-4">
    <div class="flex items-center gap-3">
      <div class="flex items-center gap-2">
        <span class="loading loading-ring loading-sm"></span>
      </div>
    </div>

    <LogsSearchInput {onSearchChange} />

    <button
      disabled={!selectedDateRange}
      class="btn btn-outline btn-sm btn-secondary gap-1.5"
      onclick={() => {
        selectedDateRange = null;
        logsState.setFilters({
          searchString: '',
          startDate: null,
          endDate: null,
        });
      }}
    >
      <span>Clear filters</span>
    </button>

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
