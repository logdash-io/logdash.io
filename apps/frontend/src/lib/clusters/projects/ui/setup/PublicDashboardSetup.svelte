<script lang="ts">
  import { page } from '$app/state';
  import { monitoringState } from '$lib/clusters/projects/application/monitoring.state.svelte.js';
  import { stripProtocol } from '$lib/shared/utils/url.js';
  import { onMount, type Snippet } from 'svelte';
  import {
    publicDashboardManagerState,
  } from '../../application/public-dashboards/public-dashboard-configurator.state.svelte.js';
  import {
    publicDashboardPrivateState,
  } from '../../application/public-dashboards/public-dashboard-private.state.svelte.js';
  import PublicDashboard from '../PublicDashboard.svelte';
  import { autoFocus } from '$lib/shared/ui/actions/use-autofocus.svelte.js';
  import { debounce } from '$lib/shared/utils/debounce.js';
  import { clustersState } from '$lib/clusters/clusters/application/clusters.state.svelte.js';
  import ResponsiveSkyBackground from '$lib/shared/upgrade/ResponsiveSkyBackground.svelte';

  type Props = {
    dashboard_id: string;
    claimer: Snippet<[boolean]>;
  };
  const { claimer, dashboard_id }: Props = $props();

  let dashboardName = $state('');
  const debouncedNameUpdate = debounce((name: string) => {
    publicDashboardManagerState.update(dashboard_id, { name });
  }, 250);

  const clusterId = $derived(page.params.cluster_id);
  const cluster = $derived(clustersState.get(clusterId));
  const dashboard = $derived(
    publicDashboardManagerState.getDashboard(dashboard_id),
  );
  const dashboardMonitors = $derived(dashboard?.httpMonitorsIds || []);

  onMount(() => {
    monitoringState.load(clusterId);
    publicDashboardManagerState.loadPublicDashboards(clusterId);
  });

  $effect(() => {
    dashboardMonitors.length;

    publicDashboardPrivateState.loadDashboard(dashboard_id);
  });

  $effect(() => {
    if (dashboardName.trim().length === 0) {
      return;
    }

    debouncedNameUpdate(dashboardName);
  });
</script>

<div class="bg-base-300 fixed left-0 top-0 z-50 flex h-full w-full">
  <ResponsiveSkyBackground />
  <div class="mx-auto space-y-8 overflow-hidden z-10">
    <PublicDashboard
      enablePolling={false}
      state={publicDashboardPrivateState}
      title={dashboardName}
    />
  </div>

  <div
    class="bg-base-200 z-10 border-base-100 sm:w-xl right-0 top-0 flex h-full w-full max-w-2xl shrink-0 flex-col gap-4 overflow-auto border-l p-6 sm:p-8"
  >
    <div class="space-y-2">
      <span class="badge badge-soft badge-primary">
        {#if cluster}Configuring {cluster.name}{:else}
          <span class="loading loading-spinner w-3"></span>
        {/if}
      </span>

      <h5 class="text-2xl font-semibold">
        Setup Public Dashboard for your project
      </h5>

      <p class="text-base-content opacity-60">
        Share status of your services with the world.
      </p>
    </div>

    <div class="collapse-open collapse overflow-visible rounded-none">
      <div class="px-1 py-4 font-semibold">
        <span>1. Select http monitors</span>
      </div>

      <div class="w-full max-w-full space-y-2 truncate">
        {#each monitoringState.monitors as monitor}
          <label
            class="border-base-100 hover:bg-base-100/50 flex cursor-pointer select-none items-center gap-1 truncate rounded-xl border p-2 px-3 transition-all"
          >
            <input
              type="checkbox"
              class="checkbox checkbox-sm checkbox-primary"
              checked={dashboardMonitors.includes(monitor.id)}
              onchange={() => {
                publicDashboardManagerState.toggleMonitor(
                  dashboard_id,
                  monitor.id,
                );
              }}
            />
            <span class="ml-2 truncate text-lg font-semibold">
              {monitor.name || stripProtocol(monitor.url)}
            </span>
          </label>
        {/each}
      </div>
    </div>

    <div class="collapse-open">
      <div class="px-1 py-4 font-semibold">
        <span>2. Choose name</span>
      </div>

      <div class="text-sm">
        <p class="mb-2">
          The name will be used in the header of your public dashboard.
        </p>
        <input
          bind:value={dashboardName}
          class="input-sm input-ghost selection:bg-secondary/20 border-secondary/20 focus:border-primary h-full w-full rounded-lg border px-3 py-2 text-lg font-semibold outline-0 focus:bg-transparent"
          placeholder={dashboard?.name || 'Status Page'}
          type="text"
          use:autoFocus={{ selectAll: true }}
        />
      </div>
    </div>

    {@render claimer(dashboard?.isPublic)}
  </div>
</div>
