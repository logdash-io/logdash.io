<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { untrack } from 'svelte';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import { serviceEntries } from '$lib/domains/app/clusters/application/service-entries.js';
  import {
    domainLabel,
    listServices,
    type ServiceItem,
  } from '$lib/domains/app/clusters/domain/service-groups.js';
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import {
    getStatusFromMonitor,
    type ServiceStatus,
  } from '$lib/domains/app/clusters/application/get-status-from-monitor.js';
  import ServiceTile from './ServiceTile.svelte';
  import CreateServiceTile from './CreateServiceTile.svelte';
  import EmptyState from './EmptyState.svelte';

  type Props = {
    clusterId: string;
  };

  const { clusterId }: Props = $props();

  const cluster = $derived(clustersState.get(clusterId));
  const entries = $derived(serviceEntries(cluster));
  const tiles = $derived(listServices(entries));
  const subtitle = $derived(
    domainLabel(
      cluster?.name ?? '',
      entries.map((entry) => entry.url),
    ) ?? 'Services in this project',
  );

  $effect(() => {
    const syncedClusterId = clusterId;
    void untrack(() => monitoringState.sync(syncedClusterId));

    return () => {
      monitoringState.unsync();
    };
  });

  function onServiceSelect(projectId: string): void {
    void goto(
      resolve('/app/clusters/[cluster_id]/[project_id]', {
        cluster_id: clusterId,
        project_id: projectId,
      }),
    );
  }

  function getStatus(projectId: string): ServiceStatus {
    return getStatusFromMonitor(
      monitoringState.getMonitorByProjectId(projectId),
    );
  }
</script>

<div class="flex w-full flex-col gap-6">
  <div class="flex min-w-0 flex-col items-start">
    <h1 class="max-w-full truncate text-xl font-medium tracking-[-0.01em]">
      {cluster?.name || 'Project'}
    </h1>
    <p class="text-neutral-500 max-w-full truncate text-sm">{subtitle}</p>
  </div>

  {#if entries.length === 0}
    <EmptyState {clusterId} />
  {:else}
    <div class="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
      {#each tiles.services as item (item.id)}
        {@render serviceTile(item)}
      {/each}

      <CreateServiceTile {clusterId} />
    </div>

    {#if tiles.dependencies.length > 0}
      <section class="flex flex-col gap-2">
        <h2 class="text-neutral-400 text-sm">Dependencies</h2>

        <div class="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
          {#each tiles.dependencies as item (item.id)}
            {@render serviceTile(item)}
          {/each}
        </div>
      </section>
    {/if}
  {/if}
</div>

{#snippet serviceTile(item: ServiceItem)}
  <ServiceTile
    projectId={item.id}
    name={item.label}
    url={item.urlLabel}
    status={getStatus(item.id)}
    onclick={() => onServiceSelect(item.id)}
  />
{/snippet}
