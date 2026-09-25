<script lang="ts">
  import { resolve } from '$app/paths';
  import { Button, Select, Spinner } from '@logdash/hyper-ui/presentational';
  import Modal from '$lib/domains/shared/ui/Modal.svelte';
  import { stripProtocol } from '$lib/domains/shared/utils/url.js';
  import { publicDashboardManagerState } from '$lib/domains/app/projects/application/public-dashboards/public-dashboard-configurator.state.svelte.js';
  import type { Monitor } from '$lib/domains/app/projects/domain/monitoring/monitor.js';
  import BadgePicker from '../../../setup/status-page/BadgePicker.svelte';

  type Props = {
    isOpen: boolean;
    onClose: () => void;
    clusterId: string;
    monitor: Monitor;
  };

  const { isOpen, onClose, clusterId, monitor }: Props = $props();

  let hasLoaded = $state(false);
  let selectedDashboardId = $state<string | undefined>();

  const publishedDashboards = $derived(
    publicDashboardManagerState.dashboards.filter(
      (dashboard) =>
        dashboard.isPublic && dashboard.httpMonitorsIds.includes(monitor.id),
    ),
  );
  const dashboard = $derived(
    publishedDashboards.find(
      (candidate) => candidate.id === selectedDashboardId,
    ) ?? publishedDashboards[0],
  );

  $effect(() => {
    if (!isOpen) return;

    void loadDashboards();
  });

  async function loadDashboards(): Promise<void> {
    await publicDashboardManagerState.loadPublicDashboards(clusterId);
    hasLoaded = true;
  }
</script>

<Modal {isOpen} {onClose}>
  <div class="flex flex-col gap-4">
    <div class="flex flex-col gap-1">
      <h3 class="text-lg font-medium">README badge</h3>
      <p class="text-sm text-neutral-400">
        Show the uptime of {monitor.name || stripProtocol(monitor.url ?? '')} in
        a README or on your website.
      </p>
    </div>

    {#if !hasLoaded}
      <Spinner size="sm" />
    {:else if !dashboard}
      <div
        class="border-border-default flex flex-col gap-3 rounded-xl border p-4"
      >
        <p class="text-sm text-neutral-300">
          Badges show the data of a published status page and link back to it.
          Add this monitor to a status page and publish it to get its badge.
        </p>
        <Button
          href={resolve('/app/clusters/[cluster_id]/status-pages', {
            cluster_id: clusterId,
          })}
          variant="primary"
          size="sm"
          class="self-start"
        >
          Go to status pages
        </Button>
      </div>
    {:else}
      {#if publishedDashboards.length > 1}
        <label class="flex flex-col gap-1.5 text-sm">
          <span class="text-neutral-400">Status page</span>
          <Select size="sm" class="w-full" bind:value={selectedDashboardId}>
            {#each publishedDashboards as option (option.id)}
              <option value={option.id}>{option.name}</option>
            {/each}
          </Select>
        </label>
      {/if}

      {#key dashboard.id}
        <BadgePicker
          dashboardId={dashboard.id}
          statusPageUrl={publicDashboardManagerState.getStatusPageUrl(
            dashboard.id,
          )}
          monitors={[monitor]}
        />
      {/key}
    {/if}
  </div>
</Modal>
