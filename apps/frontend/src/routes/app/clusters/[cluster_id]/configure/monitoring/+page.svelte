<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import MonitoringSetup from '$lib/domains/app/projects/ui/setup/MonitoringSetup.svelte';
  import { fade } from 'svelte/transition';
  import { MonitorMode } from '$lib/domains/app/projects/domain/monitoring/monitor-mode.js';

  type Props = {
    data: { project_id: string; api_key: string };
  };
  const { data }: Props = $props();
  let tryingToClaim = $state(false);
  const url = $derived(page.url.searchParams.get('url'));
  const name = $derived(page.url.searchParams.get('name'));
  const mode = $derived(
    (page.url.searchParams.get('mode') as MonitorMode) || MonitorMode.PULL,
  );
</script>

{#snippet claimer(hasLogs: boolean)}
  <div class="mt-auto flex w-full flex-1 items-center gap-4">
    <button
      onclick={() => {
        tryingToClaim = true;

        goto(
          `/app/api/clusters/${page.params.cluster_id}/monitors/create?project_id=${data.project_id}&url=${url}&name=${name}&mode=${mode}`,
          {
            invalidateAll: true,
          },
        );
      }}
      in:fade={{ duration: 100 }}
      class={['btn btn-primary flex-1 whitespace-nowrap']}
      disabled={!hasLogs || tryingToClaim}
      data-posthog-id="complete-setup-button"
    >
      {#if tryingToClaim}
        <span class="loading loading-xs"></span>
      {/if}
      Complete setup
    </button>
  </div>
{/snippet}

<MonitoringSetup {claimer} {...data} />
