<script lang="ts">
  import type { PublicDashboardState } from '../application/public-dashboards/public-dashboard.state.svelte.js';
  import {
    SystemStatusHeader,
    DashboardTitle,
    MonitorCard,
    EmptyState,
    DashboardFooter,
  } from './presentational/public-dashboard';

  interface Props {
    state: PublicDashboardState;
    title?: string;
    maxBucketsToShow?: number;
    maxPingsToShow?: number;
    enablePolling?: boolean;
    pollingInterval?: number;
    onRefresh?: () => void;
  }

  let {
    state: dashboardState,
    title,
    maxBucketsToShow = 90,
    maxPingsToShow = 90,
    enablePolling = true,
    pollingInterval = 60,
    onRefresh,
  }: Props = $props();

  const dashboardData = $derived(dashboardState.data);
  const loading = $derived(dashboardState.isLoading);
  const systemStatus = $derived(dashboardState.systemStatus);
  const lastUpdated = $derived(dashboardState.lastUpdate);
  const pageName = $derived(title || dashboardData?.name || 'Status Page');
</script>

<svelte:head>
  <title>{pageName}</title>
  <meta
    name="description"
    content="Real-time status dashboard for our services"
  />
</svelte:head>

<div class="mx-auto h-full w-fit max-w-none">
  <div class="w-fit px-4 py-8 sm:px-6 lg:px-8">
    <DashboardTitle {loading} {enablePolling} {pollingInterval} {onRefresh}>
      {pageName}
    </DashboardTitle>

    {#if dashboardData && dashboardData.httpMonitors.length > 0}
      <SystemStatusHeader
        {systemStatus}
        {lastUpdated}
        monitorCount={dashboardData.httpMonitors.length}
      />

      <div class="mb-4">
        <div class="space-y-4">
          {#each dashboardData.httpMonitors as monitor, index (index)}
            {@const status = dashboardState.getMonitorStatus(monitor)}
            {@const uptime = dashboardState.getUptimeFromBuckets(monitor, 90)}

            <MonitorCard
              {monitor}
              {status}
              {uptime}
              {maxBucketsToShow}
              {maxPingsToShow}
            />
          {/each}
        </div>
      </div>
    {:else}
      <EmptyState
        title="No Monitors Found"
        description="No HTTP monitors selected. Please add monitors to see their status."
      />
    {/if}

    <DashboardFooter />
  </div>
</div>
