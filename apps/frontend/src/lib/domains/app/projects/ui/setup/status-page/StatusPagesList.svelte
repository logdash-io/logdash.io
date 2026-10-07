<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import { publicDashboardManagerState } from '$lib/domains/app/projects/application/public-dashboards/public-dashboard-configurator.state.svelte.js';
  import type { PublicDashboard } from '$lib/domains/app/projects/domain/public-dashboards/public-dashboard.js';
  import { readHttpErrorMessage } from '$lib/domains/shared/http/http-error';
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';
  import RocketIcon from '$lib/domains/shared/icons/RocketIcon.svelte';
  import { topBarState } from '$lib/domains/app/clusters/application/top-bar.state.svelte.js';
  import Well from '$lib/domains/shared/ui/components/Well.svelte';
  import {
    TOOLBAR_CONTROL,
    TOOLBAR_PRIMARY,
  } from '$lib/domains/shared/ui/components/toolbar.js';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import { upgradeState } from '$lib/domains/shared/upgrade/upgrade.state.svelte.js';
  import { Spinner } from '@logdash/hyper-ui/presentational';
  import StatusPageRow from './StatusPageRow.svelte';

  type Props = {
    clusterId: string;
    dashboards: PublicDashboard[];
  };

  const { clusterId, dashboards }: Props = $props();

  let isCreating = $state(false);

  const canCreate = $derived(clustersState.canCreateStatusPage(clusterId));

  $effect(() => topBarState.show(toolbar));

  function publicUrl(dashboard: PublicDashboard): string {
    if (dashboard.customDomain?.status === 'verified') {
      return `https://${dashboard.customDomain.domain}`;
    }

    return `${page.url.origin}/d/${dashboard.id}`;
  }

  async function onCreate(): Promise<void> {
    if (isCreating) return;
    isCreating = true;

    try {
      const dashboard = await publicDashboardManagerState.create(
        clusterId,
        'Status page',
      );
      toast.success('Status page created');
      await goto(
        resolve('/app/domains/[cluster_id]/status-pages/[status_page_id]', {
          cluster_id: clusterId,
          status_page_id: dashboard.id,
        }),
        { invalidateAll: true },
      );
    } catch (error) {
      const reason = readHttpErrorMessage(error);
      toast.error(
        reason
          ? `Failed to create status page: ${reason}`
          : 'Failed to create status page',
      );
    } finally {
      isCreating = false;
    }
  }

  function onUpgrade(): void {
    window.logdash?.track('upgrade_button_clicked');
    upgradeState.openModal('status-page-limit');
  }

  async function onCopyUrl(dashboard: PublicDashboard): Promise<void> {
    await navigator.clipboard.writeText(publicUrl(dashboard));
    toast.success('Status page URL copied to clipboard');
  }
</script>

<div class="flex w-full flex-col gap-2 p-2">
  <Well label="Status pages" title="Status pages">
    {#if dashboards.length > 0}
      <ul class="flex flex-col gap-0.5">
        {#each dashboards as dashboard (dashboard.id)}
          <StatusPageRow
            {clusterId}
            statusPageId={dashboard.id}
            name={dashboard.name}
            url={publicUrl(dashboard)}
            monitorsCount={dashboard.httpMonitorsIds.length}
            isPublished={dashboard.isPublic}
            onCopyUrl={() => onCopyUrl(dashboard)}
          />
        {/each}
      </ul>
    {:else}
      <div
        class="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center"
      >
        <p class="font-medium">No status pages yet</p>
        <p class="text-fg-tertiary max-w-sm text-sm">
          Share the status of your domain so your users know what is going on.
        </p>
      </div>
    {/if}
  </Well>
</div>

{#snippet toolbar()}
  {#if canCreate}
    <button
      type="button"
      class={TOOLBAR_PRIMARY}
      disabled={isCreating}
      onclick={onCreate}
    >
      {#if isCreating}
        <Spinner class="size-3.5 shrink-0" aria-hidden="true" />
      {:else}
        <PlusIcon class="size-4 shrink-0" />
      {/if}
      New status page
    </button>
  {:else}
    <button type="button" class={TOOLBAR_CONTROL} onclick={onUpgrade}>
      <RocketIcon class="size-3.5 shrink-0" />
      Upgrade for more
    </button>
  {/if}
{/snippet}
