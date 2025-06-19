<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import {
    publicDashboardManagerState,
  } from '$lib/clusters/projects/application/public-dashboards/public-dashboard-configurator.state.svelte.js';
  import PublicDashboardSetup from '$lib/clusters/projects/ui/setup/PublicDashboardSetup.svelte';
  import { toast } from '$lib/shared/ui/toaster/toast.state.svelte.js';
  import { fade } from 'svelte/transition';
  import { exposedConfigState } from '$lib/shared/exposed-config/application/exposed-config.state.svelte';
  import { clustersState } from '$lib/clusters/clusters/application/clusters.state.svelte';
  import { userState } from '$lib/shared/user/application/user.state.svelte';
  import UpgradeButton from '$lib/shared/upgrade/UpgradeButton.svelte';

  type Props = {
    data: { dashboard_id: string };
  };
  const { data }: Props = $props();
  let tryingToClaim = $state(false);
</script>

{#snippet claimer(isPublic: boolean)}
  <div class="mt-auto space-y-2">
    {#if isPublic}
      <button
        onclick={() => {
          tryingToClaim = true;

          publicDashboardManagerState
            .update(data.dashboard_id, {
              isPublic: false,
            })
            .then(() => {
              goto(`/app/clusters/${page.params.cluster_id}`, {
                invalidateAll: true,
              });
              toast.success(
                'Dashboard is now unpublished, you can still configure it.',
              );
            });
        }}
        in:fade={{ duration: 100 }}
        class={['btn btn-secondary w-full flex-1 whitespace-nowrap']}
        disabled={tryingToClaim}
        data-posthog-id="complete-setup-button"
      >
        {#if tryingToClaim}
          <span class="loading loading-xs"></span>
        {/if}
        Unpublish dashboard
      </button>
    {:else}
      {@const totalPublicDashboardCount = clustersState.publishedDashboardsCount}
      {@const canPublish = totalPublicDashboardCount < exposedConfigState.maxNumberOfPublicDashboards(userState.tier)}

      {#if canPublish}
        <button
          onclick={() => {
          tryingToClaim = true;

          publicDashboardManagerState
            .update(data.dashboard_id, {
              isPublic: true,
            })
            .then(() => {
              goto(`/app/clusters/${page.params.cluster_id}`, {
                invalidateAll: true,
              });
              toast.success('Dashboard is now public.');

              window.open(`/d/${data.dashboard_id}`, '_blank');
            });
        }}
          in:fade={{ duration: 100 }}
          class={['btn btn-primary w-full flex-1 whitespace-nowrap']}
          disabled={tryingToClaim}
          data-posthog-id="complete-setup-button"
        >
          {#if tryingToClaim}
            <span class="loading loading-xs"></span>
          {/if}
          Publish dashboard
        </button>
      {:else}
        <UpgradeButton>
          Upgrade to publish more dashboards
        </UpgradeButton>
      {/if}
    {/if}
  </div>
{/snippet}

<PublicDashboardSetup {...data} {claimer} />
