<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import StatusPageEmptyState from '$lib/domains/app/projects/ui/setup/status-page/StatusPageEmptyState.svelte';
  import StatusPageCard from '$lib/domains/app/projects/ui/setup/status-page/StatusPageCard.svelte';
  import type { PublicDashboard } from '$lib/domains/app/projects/domain/public-dashboards/public-dashboard';

  type Props = {
    data: {
      dashboard: PublicDashboard | null;
      clusterId: string;
    };
  };
  const { data }: Props = $props();

  const clusterId = $derived(page.params.cluster_id);
  let dashboard = $state<PublicDashboard | null>(data.dashboard);

  function onDashboardCreated(newDashboard: PublicDashboard): void {
    dashboard = newDashboard;
    goto(`/app/clusters/${clusterId}/status-pages/${newDashboard.id}`);
  }
</script>

<div class="flex h-full w-full flex-col overflow-y-auto">
  {#if dashboard}
    <StatusPageCard {clusterId} dashboardId={dashboard.id} />
  {:else}
    <StatusPageEmptyState {clusterId} {onDashboardCreated} />
  {/if}
</div>
