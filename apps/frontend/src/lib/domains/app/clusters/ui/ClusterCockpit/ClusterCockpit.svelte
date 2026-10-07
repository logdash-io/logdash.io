<script lang="ts">
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import { topBarState } from '$lib/domains/app/clusters/application/top-bar.state.svelte.js';
  import Well from '$lib/domains/shared/ui/components/Well.svelte';
  import CreateServiceButton from './CreateServiceButton.svelte';
  import ServiceErrorsBadge from './ServiceErrorsBadge.svelte';
  import ServiceRow from './ServiceRow.svelte';

  type Props = {
    clusterId: string;
  };

  const { clusterId }: Props = $props();

  const services = $derived(clustersState.get(clusterId)?.projects ?? []);

  $effect(() => topBarState.show(toolbar));
</script>

<div class="flex w-full flex-col gap-2 p-2">
  <Well label="Services" title="Services">
    {#if services.length}
      <ul class="flex flex-col gap-0.5">
        {#each services as service (service.id)}
          <ServiceRow name={service.name} {clusterId} projectId={service.id}>
            <ServiceErrorsBadge projectId={service.id} />
          </ServiceRow>
        {/each}
      </ul>
    {:else}
      <div
        class="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center"
      >
        <p class="font-medium">No services yet</p>
        <p class="text-fg-tertiary max-w-sm text-sm">
          A service is a backend, worker or app that sends logs and metrics from
          its code. Uptime checks live on the domain, in Uptime.
        </p>
      </div>
    {/if}
  </Well>
</div>

{#snippet toolbar()}
  <CreateServiceButton {clusterId} />
{/snippet}
