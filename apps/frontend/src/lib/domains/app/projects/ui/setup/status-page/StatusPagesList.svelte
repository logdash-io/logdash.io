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
  import EmptyState from '$lib/domains/shared/ui/components/EmptyState.svelte';
  import PaneHeader, {
    PANE_HEADER_ACTION_CLASS,
  } from '$lib/domains/shared/ui/components/PaneHeader.svelte';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import UpgradeButton from '$lib/domains/shared/upgrade/UpgradeButton.svelte';
  import { upgradeState } from '$lib/domains/shared/upgrade/upgrade.state.svelte.js';
  import { Button, Spinner } from '@logdash/hyper-ui/presentational';
  import type { PostHog } from 'posthog-js';
  import { getContext } from 'svelte';
  import StatusPageRow from './StatusPageRow.svelte';

  type Props = {
    clusterId: string;
    dashboards: PublicDashboard[];
  };

  const { clusterId, dashboards }: Props = $props();

  const posthog = getContext<PostHog | undefined>('posthog');

  let isCreating = $state(false);

  const canCreate = $derived(clustersState.canCreateStatusPage(clusterId));

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
    posthog?.capture('upgrade_button_clicked', {
      source: 'status-page-limit',
      timestamp: new Date().toISOString(),
    });
    upgradeState.openModal('status-page-limit');
  }

  async function onCopyUrl(dashboard: PublicDashboard): Promise<void> {
    await navigator.clipboard.writeText(publicUrl(dashboard));
    toast.success('Status page URL copied to clipboard');
  }
</script>

<PaneHeader title="Status pages">
  <span class="tabular-nums">
    {dashboards.length}
    {dashboards.length === 1 ? 'page' : 'pages'}
  </span>

  {#if dashboards.length > 0}
    {#if canCreate}
      <button
        type="button"
        class={PANE_HEADER_ACTION_CLASS}
        disabled={isCreating}
        onclick={onCreate}
        data-posthog-id="create-status-page-button"
      >
        {#if isCreating}
          <Spinner class="size-3.5 shrink-0" aria-hidden="true" />
        {:else}
          <PlusIcon class="size-3.5 shrink-0" />
        {/if}
        New status page
      </button>
    {:else}
      <button
        type="button"
        class={PANE_HEADER_ACTION_CLASS}
        onclick={onUpgrade}
      >
        <RocketIcon class="size-3.5 shrink-0" />
        Upgrade for more
      </button>
    {/if}
  {/if}
</PaneHeader>

{#if dashboards.length > 0}
  <ul class="edge-between edge-b">
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
  <EmptyState
    class="p-4"
    title="No status pages yet"
    description="Share the status of your services with everyone so they know what's going on."
  >
    {#if canCreate}
      <Button
        variant="primary"
        size="sm"
        loading={isCreating}
        onclick={onCreate}
        data-posthog-id="create-status-page-button"
      >
        <PlusIcon class="size-4" />
        Create status page
      </Button>
    {:else}
      <UpgradeButton source="status-page-limit">
        Upgrade to create more status pages
      </UpgradeButton>
    {/if}
  </EmptyState>
{/if}
