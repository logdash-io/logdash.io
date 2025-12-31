<script lang="ts">
  import { goto } from '$app/navigation';
  import { untrack } from 'svelte';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import { getStatusFromMonitor } from '$lib/domains/app/clusters/application/get-status-from-monitor.js';
  import type { Monitor } from '$lib/domains/app/projects/domain/monitoring/monitor.js';
  import ServiceCard from './ServiceTile.svelte';
  import CreateServiceTile from './CreateServiceTile.svelte';
  import EmptyState from './EmptyState.svelte';

  type Props = {
    clusterId: string;
    initialMonitors: Monitor[];
  };

  const { clusterId, initialMonitors }: Props = $props();

  const cluster = $derived(clustersState.get(clusterId));
  const projects = $derived(cluster?.projects || []);

  $effect(() => {
    monitoringState.set(initialMonitors);
    untrack(() => monitoringState.sync(clusterId));

    return () => {
      monitoringState.unsync();
    };
  });

  function onServiceSelect(projectId: string): void {
    goto(`/app/clusters/${clusterId}/${projectId}`);
  }

  function getStatus(
    projectId: string,
  ): 'up' | 'down' | 'degraded' | 'unknown' {
    const monitor = monitoringState.getMonitorByProjectId(projectId);
    return getStatusFromMonitor(monitor);
  }
</script>

<div class="flex w-full flex-col gap-4 p-3">
  <div class="flex items-start flex-col">
    <h1 class="text-xl font-semibold">{cluster?.name || 'Project'}</h1>
    <p class="text-base-content/60 text-sm">Project overview</p>
  </div>

  {#if projects.length === 0}
    <EmptyState {clusterId} />
  {:else}
    <div class="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
      {#each projects as project}
        <ServiceCard
          projectId={project.id}
          name={project.name}
          status={getStatus(project.id)}
          onclick={() => onServiceSelect(project.id)}
        />
      {/each}

      <CreateServiceTile {clusterId} />
    </div>
  {/if}
</div>
