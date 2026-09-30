<script lang="ts">
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import { clusterHealthState } from '$lib/domains/app/clusters/application/cluster-health.state.svelte.js';
  import {
    SERVICE_STATUS_DOT,
    type ServiceStatus,
  } from '$lib/domains/app/clusters/domain/service-status.js';
  import { domainLabel } from '$lib/domains/app/clusters/domain/service-groups.js';
  import type { Cluster } from '$lib/domains/app/clusters/domain/cluster.js';
  import ProjectTile from '$lib/domains/app/clusters/ui/ClusterSidebar/ProjectTile.svelte';
  import ClusterCreatorTile from '$lib/domains/app/clusters/ui/ClustersList/ClusterCreatorTile.svelte';
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';
  import PaneHeader from '$lib/domains/shared/ui/components/PaneHeader.svelte';

  type Props = {
    canCreate: boolean;
  };

  type DomainService = {
    id: string;
    name: string;
    status: ServiceStatus;
  };

  const { canCreate }: Props = $props();

  const CHIP_CLASS =
    'ring-hairline hover:bg-surface-150 hover:text-fg-default relative flex h-8 max-w-full min-w-0 items-center gap-1.5 rounded-full px-3 text-xs ring-1 ring-inset';

  const clusters = $derived(clustersState.clusters);

  onMount(() => {
    return clusterHealthState.startPolling(
      clustersState.clusters.map((cluster) => cluster.id),
    );
  });

  function servicesOf(cluster: Cluster): DomainService[] {
    return (cluster.projects ?? []).map((project) => ({
      id: project.id,
      name: project.name,
      status:
        clusterHealthState.getMonitorByProjectId(cluster.id, project.id)
          ?.lastStatus ?? 'unknown',
    }));
  }

  function servicesLabel(count: number): string {
    return count === 1 ? '1 service' : `${count} services`;
  }
</script>

<PaneHeader title="Domains">
  <span class="tabular-nums">
    {clusters.length}
    {clusters.length === 1 ? 'domain' : 'domains'}
  </span>
</PaneHeader>

<ul
  class="divide-hairline border-hairline flex shrink-0 flex-col divide-y border-b"
>
  {#each clusters as cluster (cluster.id)}
    {@render domainRow(cluster)}
  {/each}

  <li>
    <ClusterCreatorTile canAddMore={canCreate} />
  </li>
</ul>

{#snippet domainRow(cluster: Cluster)}
  {@const services = servicesOf(cluster)}
  {@const down = services.filter(({ status }) => status === 'down').length}
  {@const domain = domainLabel(
    cluster.name,
    clusterHealthState.getMonitors(cluster.id).map((monitor) => monitor.url),
  )}
  {@const home = resolve('/app/domains/[cluster_id]', {
    cluster_id: cluster.id,
  })}

  <li class="hover:bg-surface-100 relative flex flex-col gap-3 p-4">
    <div class="flex min-w-0 items-center gap-3">
      <ProjectTile
        name={cluster.name}
        color={cluster.color}
        class="size-5 rounded-md text-[11px]"
      />

      <div class="flex min-w-0 flex-1 items-baseline gap-2">
        <a
          href={home}
          class="focus-visible:after:outline-brand max-w-full shrink-0 truncate text-base font-medium outline-none after:absolute after:inset-0 focus-visible:after:-outline-offset-2 focus-visible:after:outline-2"
        >
          {cluster.name}
        </a>

        {#if domain}
          <span class="text-neutral-500 min-w-0 truncate text-sm">
            {domain}
          </span>
        {/if}
      </div>

      <span class="text-neutral-500 shrink-0 text-xs tabular-nums">
        {services.length ? servicesLabel(services.length) : 'No services'}
        {#if down}
          <span class="text-neutral-700">·</span>
          <span class="text-error">{down} down</span>
        {/if}
      </span>
    </div>

    <div class="flex flex-wrap gap-2">
      {#each services as service (service.id)}
        <a
          href={resolve('/app/domains/[cluster_id]/[project_id]', {
            cluster_id: cluster.id,
            project_id: service.id,
          })}
          class={[CHIP_CLASS, 'text-neutral-400']}
        >
          <span
            class={[
              'size-1.5 shrink-0 rounded-full',
              SERVICE_STATUS_DOT[service.status],
            ]}
          ></span>
          <span class="truncate">{service.name}</span>
        </a>
      {:else}
        <a href={home} class={[CHIP_CLASS, 'text-neutral-500']}>
          <PlusIcon class="size-3.5 shrink-0 text-neutral-600" />
          New service
        </a>
      {/each}
    </div>
  </li>
{/snippet}
