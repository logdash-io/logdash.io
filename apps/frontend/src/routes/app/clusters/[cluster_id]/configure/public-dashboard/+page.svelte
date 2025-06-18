<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import PublicDashboardSetup from '$lib/clusters/projects/ui/setup/PublicDashboardSetup.svelte';
  import { fade } from 'svelte/transition';

  type Props = {
    data: { dashboard_id: string };
  };
  const { data }: Props = $props();
  let tryingToClaim = $state(false);
</script>

{#snippet claimer(ready: boolean)}
  <div class="mt-auto flex items-center gap-4">
    <button
      onclick={() => {
        tryingToClaim = true;

        goto(`/app/clusters/${page.params.cluster_id}`, {
          invalidateAll: true,
        });

        window.open(`/d/${data.dashboard_id}`, '_blank');
      }}
      in:fade={{ duration: 100 }}
      class={['btn btn-primary flex-1 whitespace-nowrap']}
      disabled={!ready || tryingToClaim}
      data-posthog-id="complete-setup-button"
    >
      {#if tryingToClaim}
        <span class="loading loading-xs"></span>
      {/if}
      Publish dashboard
    </button>
  </div>
{/snippet}

<PublicDashboardSetup {...data} {claimer} />
