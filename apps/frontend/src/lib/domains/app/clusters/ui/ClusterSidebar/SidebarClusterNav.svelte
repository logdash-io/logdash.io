<script lang="ts">
  import { page } from '$app/state';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import { wizardState } from '$lib/domains/app/clusters/application/wizard.state.svelte.js';
  import HomeIcon from '$lib/domains/shared/icons/HomeIcon.svelte';
  import PublicDashboardIcon from '$lib/domains/shared/icons/PublicDashboardIcon.svelte';
  import SettingsIcon from '$lib/domains/shared/icons/SettingsIcon.svelte';
  import SidebarMenuItem from './SidebarMenuItem.svelte';

  const isWizardMode = $derived(wizardState.isActive);

  const clusterId = $derived(page.params.cluster_id);
  const currentPath = $derived(page.url.pathname);

  const isCockpitActive = $derived(
    currentPath === `/app/clusters/${clusterId}`,
  );
  const isSettingsActive = $derived(
    currentPath === `/app/clusters/${clusterId}/settings`,
  );
  const isStatusPagesActive = $derived(
    currentPath === `/app/clusters/${clusterId}/status-pages`,
  );

  const cluster = $derived(clustersState.get(clusterId));
  const clusterPublicDashboard = $derived(cluster?.publicDashboards?.[0]);
  const isPublished = $derived(clusterPublicDashboard?.isPublic ?? false);
</script>

<nav class="flex flex-col gap-0.5">
  <SidebarMenuItem
    href="/app/clusters/{clusterId}"
    isActive={isCockpitActive}
    disabled={!clusterId || isWizardMode}
  >
    <HomeIcon class="size-4 shrink-0" />
    <span class="truncate">Home</span>
  </SidebarMenuItem>

  <SidebarMenuItem
    href="/app/clusters/{clusterId}/settings"
    isActive={isSettingsActive}
    disabled={!clusterId || isWizardMode}
  >
    <SettingsIcon class="size-4 shrink-0" />
    <span class="truncate">Settings</span>
  </SidebarMenuItem>

  <SidebarMenuItem
    href="/app/clusters/{clusterId}/status-pages"
    isActive={isStatusPagesActive}
    disabled={!clusterId || isWizardMode}
  >
    <PublicDashboardIcon
      class={['size-4 shrink-0', { 'text-success': isPublished }]}
    />
    <span class="truncate">Status pages</span>
  </SidebarMenuItem>
</nav>
