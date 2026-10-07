<script lang="ts">
  import { resolve } from '$app/paths';
  import { CloseIcon } from '@logdash/hyper-ui/icons';
  import { Button, Select, Spinner } from '@logdash/hyper-ui/presentational';
  import Modal from '$lib/domains/shared/ui/Modal.svelte';
  import { stripProtocol } from '$lib/domains/shared/utils/url.js';
  import { publicDashboardManagerState } from '$lib/domains/app/projects/application/public-dashboards/public-dashboard-configurator.state.svelte.js';
  import type { Monitor } from '$lib/domains/app/projects/domain/monitoring/monitor.js';
  import BadgePicker from '$lib/domains/app/projects/ui/setup/status-page/BadgePicker.svelte';

  type Props = {
    isOpen: boolean;
    onClose: () => void;
    clusterId: string;
    monitor: Monitor;
  };

  const { isOpen, onClose, clusterId, monitor }: Props = $props();
  const titleId = $props.id();

  let hasLoaded = $state(false);
  let loadFailed = $state(false);
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
    hasLoaded = false;
    loadFailed =
      !(await publicDashboardManagerState.loadPublicDashboards(clusterId));
    hasLoaded = true;
  }
</script>

<Modal {isOpen} {onClose} aria-labelledby={titleId}>
  <div class="flex flex-col gap-4">
    <div class="flex items-start justify-between gap-3">
      <div class="flex min-w-0 flex-col gap-1">
        <h3 id={titleId} class="text-lg font-medium">README badge</h3>
        <p class="text-sm text-fg-tertiary">
          Show the uptime of {monitor.name || stripProtocol(monitor.url ?? '')}
          in a README or on your website.
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        shape="circle"
        class="-mt-1 -mr-1 shrink-0"
        onclick={onClose}
        aria-label="Close"
      >
        <CloseIcon class="size-4" />
      </Button>
    </div>

    {#if !hasLoaded}
      <div class="flex min-h-29 items-center justify-center">
        <Spinner size="sm" aria-label="Loading status pages" />
      </div>
    {:else if loadFailed}
      <div
        class="border-surface-elevated-border flex flex-col gap-3 rounded-xl border p-4"
      >
        <p class="text-sm text-fg-secondary">
          The status pages of this domain could not be loaded.
        </p>
        <Button
          size="sm"
          class="self-start"
          onclick={() => void loadDashboards()}
        >
          Try again
        </Button>
      </div>
    {:else if !dashboard}
      <div
        class="border-surface-elevated-border flex flex-col gap-3 rounded-xl border p-4"
      >
        <p class="text-sm text-fg-secondary">
          Badges show the data of a published status page and link back to it.
          Add this monitor to a status page and publish it to get its badge.
        </p>
        <Button
          href={resolve('/app/domains/[cluster_id]/status-pages', {
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
          <span class="text-fg-tertiary">Status page</span>
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
