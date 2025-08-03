<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { monitoringService } from '$lib/domains/app/projects/infrastructure/monitoring.service.js';
  import MonitoringSetup from '$lib/domains/app/projects/ui/setup/MonitoringSetup.svelte';
  import { fade } from 'svelte/transition';

  type Props = {
    data: { project_id: string; api_key: string };
  };
  const { data }: Props = $props();
  let tryingToClaim = $state(false);

  // We need access to the monitor ID created by MonitoringSetup
  let monitorId = $state<string | undefined>();
</script>

{#snippet claimer(hasLogs: boolean)}
  <div class="mt-auto flex w-full flex-1 items-center gap-4">
    <button
      onclick={async () => {
        if (!monitorId) {
          console.error('No monitor ID available for claiming');
          return;
        }

        tryingToClaim = true;
        await monitoringService.claimMonitor(monitorId);

        goto(
          `/app/clusters/${page.params.cluster_id}/?project_id=${data.project_id}`,
          {
            invalidateAll: true,
          },
        );
      }}
      in:fade={{ duration: 100 }}
      class={['btn btn-primary flex-1 whitespace-nowrap']}
      disabled={!hasLogs || tryingToClaim || !monitorId}
      data-posthog-id="complete-setup-button"
    >
      {#if tryingToClaim}
        <span class="loading loading-xs"></span>
      {/if}
      Complete setup
    </button>
  </div>
{/snippet}

<MonitoringSetup
  {claimer}
  {...data}
  onMonitorCreated={(id) => (monitorId = id)}
/>
