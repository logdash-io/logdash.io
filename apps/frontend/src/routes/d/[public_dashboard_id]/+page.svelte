<script lang="ts">
  import { publicDashboardPublicState } from '$lib/domains/app/projects/application/public-dashboards/public-dashboard-public.state.svelte.js';
  import PublicDashboard from '$lib/domains/app/projects/ui/PublicDashboard.svelte';
  import type { PageData } from './$types';
  import { onMount } from 'svelte';

  const { data }: { data: PageData } = $props();

  onMount(async () => {
    // Use injected server data
    if (data.dashboardData) {
      publicDashboardPublicState.setDashboardData(data.dashboardData);
    } else {
      // Fallback to loading from API if no server data
      await publicDashboardPublicState.loadDashboard(data.dashboardId);
    }
  });
</script>

<PublicDashboard
  enablePolling={true}
  onRefresh={() => publicDashboardPublicState.loadDashboard(data.dashboardId)}
  pollingInterval={60}
  state={publicDashboardPublicState}
/>
