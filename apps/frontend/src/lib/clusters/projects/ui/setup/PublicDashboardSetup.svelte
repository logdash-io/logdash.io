<script lang="ts">
  import { page } from '$app/state';
  import { monitoringState } from '$lib/clusters/projects/application/monitoring.state.svelte.js';
  import { stripProtocol } from '$lib/shared/utils/url.js';
  import { onMount, type Snippet } from 'svelte';
  import { publicDashboardManagerState } from '../../application/public-dashboards/public-dashboard-configurator.state.svelte.js';
  import { publicDashboardPrivateState } from '../../application/public-dashboards/public-dashboard-private.state.svelte.js';
  import PublicDashboard from '../PublicDashboard.svelte';

  type Props = {
    dashboard_id: string;
    claimer: Snippet<[boolean]>;
  };
  const { claimer, dashboard_id }: Props = $props();

  const clusterId = $derived(page.params.cluster_id);
  const dashboardMonitors = $derived(
    publicDashboardManagerState.getMonitors(dashboard_id),
  );

  onMount(() => {
    monitoringState.load(clusterId);
    publicDashboardManagerState.loadPublicDashboards(clusterId);
  });

  $effect(() => {
    dashboardMonitors.length;

    publicDashboardPrivateState.loadDashboard(dashboard_id);
  });
</script>

<div class="bg-base-300 fixed left-0 top-0 z-50 flex h-full w-full">
  <div class="mx-auto space-y-8">
    <PublicDashboard
      enablePolling={false}
      state={publicDashboardPrivateState}
    />
  </div>

  <div
    class="bg-base-200 border-base-100 sm:w-xl right-0 top-0 flex h-full w-full max-w-2xl shrink-0 flex-col gap-4 overflow-auto border-l p-6 sm:p-8"
  >
    <div class="space-y-2">
      <h5 class="text-2xl font-semibold">
        Setup Public Dashboard for your project
      </h5>

      <p class="text-base-content opacity-60">
        Share status of your services with the world.
      </p>
    </div>

    <div class="collapse-open collapse overflow-visible rounded-none">
      <div class="px-1 py-4 font-semibold">
        <span>Select http monitors</span>
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
                console.log(`Toggling monitor: ${monitor.id}`);
              }}
            />
            <span class="ml-2 truncate text-lg font-semibold">
              {monitor.name || stripProtocol(monitor.url)}
            </span>
          </label>
        {/each}
      </div>
    </div>

    <!-- <div class="collapse-open">
      <div class="px-1 py-4 font-semibold">
        <span>3. Capture pings</span>
      </div>

      <div class="text-sm">
        <MonitorsListener url={observedUrl} onCaptureOnce={() => {}}>
          <div class="flex items-center justify-start gap-2 font-semibold">
            <CheckCircle class="text-success h-5 w-5" />
            <span class="text-success opacity-80">
              Pings captured successfully!
            </span>
          </div>
        </MonitorsListener>
      </div>
    </div> -->

    {@render claimer(true)}
  </div>
</div>
