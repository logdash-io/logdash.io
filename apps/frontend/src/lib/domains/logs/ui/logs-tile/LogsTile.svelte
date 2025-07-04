<script lang="ts">
  import { getContext, onMount } from 'svelte';
  import { page } from '$app/state';
  import { logsState } from '$lib/domains/logs/application/logs.state.svelte.js';
  import LogsListener from '$lib/domains/logs/ui/LogsListener.svelte';
  import LogsHeader from './header/LogsHeader.svelte';
  import LogsVirtualList from './LogsVirtualList.svelte';
  import LogsAnalyticsChart from '../LogsAnalyticsChart.svelte';

  const projectId = $derived(page.url.searchParams.get('project_id'));
  const tabId: string = getContext('tabId');

  let rendered = $state(false);
  let selectedDateRange = $state<{ start: Date; end: Date } | null>(null);

  function handleDateRangeChange(startDate: Date, endDate: Date) {
    selectedDateRange = { start: startDate, end: endDate };
    // You can integrate this with your logs filtering logic
    console.log('Date range selected:', { startDate, endDate });
  }

  onMount(() => {
    const timer = setTimeout(() => {
      rendered = true;
    }, 500);

    if (projectId) {
      logsState.sync(projectId, tabId);
    }

    return () => {
      clearTimeout(timer);
      logsState.unsync();
    };
  });
</script>

<LogsListener>
  <div class="flex flex-col space-y-6">
    {#if projectId}
      <LogsAnalyticsChart
        {projectId}
        onDateRangeChange={handleDateRangeChange}
      />
    {/if}

    <LogsHeader {projectId} />

    <LogsVirtualList logs={logsState.logs} {projectId} {rendered} />
  </div>
</LogsListener>
