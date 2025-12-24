<script lang="ts">
  import type { PublicDashboardState } from "./states";
  import {
    SystemStatusHeader,
    DashboardTitle,
    MonitorCard,
    EmptyState,
    DashboardFooter,
  } from "./components";

  interface Props {
    state: PublicDashboardState;
    title?: string;
    maxBucketsToShow?: number;
    maxPingsToShow?: number;
    enablePolling?: boolean;
    pollingInterval?: number;
    onRefresh?: () => void;
    withBranding?: boolean;
    withHeader?: boolean;
    expanded?: boolean;
  }

  let {
    state: dashboardState,
    title,
    maxBucketsToShow = 90,
    maxPingsToShow = 90,
    enablePolling = true,
    pollingInterval = 60,
    onRefresh,
    withBranding = true,
    withHeader = true,
    expanded = false,
  }: Props = $props();

  const dashboardData = $derived(dashboardState.data);
  const loading = $derived(dashboardState.isLoading);
  const systemStatus = $derived(dashboardState.systemStatus);
  const lastUpdated = $derived(dashboardState.lastUpdate);
  const pageName = $derived(title || dashboardData?.name || "Status Page");
</script>

<svelte:head>
  <title>{pageName}</title>
  <meta content="Real-time status page for your project" name="description" />
</svelte:head>

<div class="mx-auto h-full w-full max-w-none">
  <div class="w-full px-4 py-8 sm:px-6 lg:px-8">
    {#if withBranding}
      <DashboardTitle {enablePolling} {loading} {onRefresh} {pollingInterval}>
        {pageName}
      </DashboardTitle>
    {/if}

    {#if dashboardData && dashboardData.httpMonitors.length > 0}
      {#if withHeader}
        <SystemStatusHeader
          {systemStatus}
          {lastUpdated}
          monitorCount={dashboardData.httpMonitors.length}
        />
      {/if}

      <div class="mb-4">
        <div class="space-y-1.5">
          {#each dashboardData.httpMonitors as monitor, index (index)}
            {@const status = dashboardState.getMonitorStatus(monitor)}
            {@const uptime = dashboardState.getUptimeFromBuckets(monitor, 90)}

            <MonitorCard
              {monitor}
              {status}
              {uptime}
              {maxBucketsToShow}
              {maxPingsToShow}
              defaultExpanded={expanded}
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

    {#if withBranding}
      <DashboardFooter />
    {/if}
  </div>
</div>
