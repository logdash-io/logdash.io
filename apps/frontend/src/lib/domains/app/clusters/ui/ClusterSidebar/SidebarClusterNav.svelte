<script lang="ts">
  import { page } from '$app/state';
  import { clusterPulseState } from '$lib/domains/app/clusters/application/cluster-pulse.state.svelte.js';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import SidebarDomainNav from './SidebarDomainNav.svelte';

  const clusterId = $derived(page.params.cluster_id);
  const basePath = $derived(`/app/domains/${clusterId}`);
  const currentPath = $derived(page.url.pathname);

  const active = $derived.by(
    (): 'analytics' | 'uptime' | 'status-pages' | 'settings' | null => {
      if (currentPath === basePath) {
        return 'analytics';
      }

      if (currentPath.startsWith(`${basePath}/uptime`)) {
        return 'uptime';
      }

      if (currentPath === `${basePath}/settings`) {
        return 'settings';
      }

      return currentPath.startsWith(`${basePath}/status-pages`)
        ? 'status-pages'
        : null;
    },
  );

  const cluster = $derived(clustersState.get(clusterId));
  const down = $derived(clusterPulseState.down(clusterId ?? ''));
  const isPublished = $derived(
    cluster?.publicDashboards?.some(({ isPublic }) => isPublic) ?? false,
  );
</script>

<SidebarDomainNav
  {basePath}
  {active}
  disabled={!clusterId}
  published={isPublished}
  {down}
/>
