<script lang="ts">
  import type { PublicDashboardState } from '../application/public-dashboards/public-dashboard.state.svelte.js';
  import {
    SystemStatusHeader,
    MonitorCard,
    LoadingSpinner,
    EmptyState,
    DashboardFooter,
  } from './presentational/public-dashboard';

  interface Props {
    state: PublicDashboardState;
    maxBucketsToShow?: number;
    maxPingsToShow?: number;
  }

  let {
    state: dashboardState,
    maxBucketsToShow = 90,
    maxPingsToShow = 90,
  }: Props = $props();

  const dashboardData = $derived(dashboardState.data);
  const loading = $derived(dashboardState.isLoading);
  const systemStatus = $derived(dashboardState.systemStatusEnhanced);
  const lastUpdated = $derived(dashboardState.lastUpdate);
</script>

<svelte:head>
  <title>Status Dashboard</title>
  <meta
    name="description"
    content="Real-time status dashboard for our services"
  />
</svelte:head>

{#if loading}
  <LoadingSpinner message="Loading status..." />
{:else if dashboardData}
  <div class="mx-auto min-h-screen w-fit max-w-none">
    <div class="w-fit px-4 py-8 sm:px-6 lg:px-8">
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

      <DashboardFooter />
    </div>
  </div>
{:else}
  <EmptyState />
{/if}
