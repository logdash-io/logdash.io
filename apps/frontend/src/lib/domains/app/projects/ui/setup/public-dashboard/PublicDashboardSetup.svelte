<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import { publicDashboardManagerState } from '$lib/domains/app/projects/application/public-dashboards/public-dashboard-configurator.state.svelte.js';
  import { publicDashboardPrivateState } from '$lib/domains/app/projects/application/public-dashboards/public-dashboard-private.state.svelte.js';
  import { autoFocus } from '$lib/domains/shared/ui/actions/use-autofocus.svelte.js';
  import ResponsiveSkyBackground from '$lib/domains/shared/upgrade/ResponsiveSkyBackground.svelte';
  import { debounce } from '$lib/domains/shared/utils/debounce.js';
  import { stripProtocol } from '$lib/domains/shared/utils/url.js';
  import { CheckIcon } from 'lucide-svelte';
  import { onMount, type Snippet } from 'svelte';
  import { cubicInOut } from 'svelte/easing';
  import { fly, scale } from 'svelte/transition';
  import CustomDomainSetup from './CustomDomainSetup.svelte';
  import { PublicDashboard } from '@logdash/hyper-ui/features';

  type Props = {
    dashboard_id: string;
    claimer: Snippet<[boolean]>;
  };
  const { claimer, dashboard_id }: Props = $props();

  let dashboardName = $state('');
  let isLoading = $state(true);
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

    publicDashboardPrivateState.loadDashboard(dashboard_id).then(() => {
      isLoading = false;
    });
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

  <div class="z-10 mx-auto space-y-8 overflow-hidden">
    {#if isLoading}
      <div
        in:scale={{ start: 0.2, duration: 300, easing: cubicInOut }}
        class="flex w-full items-center justify-center py-24"
      >
        <span class="loading loading-spinner loading-sm"></span>
      </div>
    {:else}
      <div in:fly={{ y: -3, duration: 200, easing: cubicInOut }}>
        <PublicDashboard
          enablePolling={false}
          state={publicDashboardPrivateState}
          title={dashboardName}
        />
      </div>
    {/if}
  </div>

  <div
    class="bg-base-200 border-base-100 sm:w-xl right-0 top-0 z-10 flex h-full w-full max-w-2xl shrink-0 flex-col gap-4 overflow-auto border-l p-6 sm:p-8"
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

      <div
        class="border-base-100 w-full max-w-full overflow-hidden truncate rounded-xl border"
      >
        {#if monitoringState.monitors.length === 0}
          <div class="flex items-center justify-center py-4">
            <span class="text-secondary/70 text-center">
              <p>No HTTP monitors available.</p>
              <a href="/app/clusters/{clusterId}" class="link link-primary">
                Create a monitor first
              </a>
            </span>
          </div>
        {/if}

        {#each monitoringState.monitors as monitor, index}
          <label
            class={[
              'hover:bg-base-100/50 flex cursor-pointer select-none items-center gap-1 truncate p-2 px-3 transition-all',
              { 'border-base-100 border-t': index > 0 },
            ]}
          >
            <input
              type="checkbox"
              class="checkbox checkbox-xs checkbox-primary"
              checked={dashboardMonitors.includes(monitor.id)}
              disabled={isLoading}
              onchange={() => {
                isLoading = true;
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

    <div class="collapse-open">
      <div class="px-1 py-4 font-semibold">
        <span>3. Configure custom domain (optional)</span>
      </div>

      <CustomDomainSetup dashboardId={dashboard_id} />
    </div>

    <div class="mt-auto flex h-5 items-center justify-center gap-4 text-sm">
      {#if isLoading}
        <span class="loading loading-spinner loading-xs"></span>
        <span class="text-secondary/70">Saving changes...</span>
      {:else}
        <CheckIcon class="text-success h-5 w-5" />

        <span class="text-success">Changes saved!</span>
      {/if}
    </div>

    <div class="flex items-center gap-4">
      <button
        class={[
          'btn flex-1 whitespace-nowrap',
          {
            'btn-secondary': !dashboard?.isPublic,
            'btn-primary': dashboard?.isPublic,
          },
        ]}
        data-posthog-id="public-dashboard-setup-back-button"
        onclick={() => {
          goto(`/app/clusters/${page.params.cluster_id}`, {
            invalidateAll: true,
          });
        }}
      >
        Go back
      </button>

      {@render claimer(dashboard?.isPublic)}
    </div>
  </div>
</div>
