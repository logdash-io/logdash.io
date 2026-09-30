<script lang="ts">
  import { untrack } from 'svelte';
  import { MediaQuery } from 'svelte/reactivity';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import { serviceEntries } from '$lib/domains/app/clusters/application/service-entries.js';
  import {
    listServices,
    type ServiceItem,
  } from '$lib/domains/app/clusters/domain/service-groups.js';
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import {
    getStatusFromMonitor,
    type ServiceStatus,
  } from '$lib/domains/app/clusters/application/get-status-from-monitor.js';
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';
  import EmptyState from '$lib/domains/shared/ui/components/EmptyState.svelte';
  import PaneHeader from '$lib/domains/shared/ui/components/PaneHeader.svelte';
  import { Button } from '@logdash/hyper-ui/presentational';
  import ServiceTile from './ServiceTile.svelte';
  import ServiceErrorsBadge from './ServiceErrorsBadge.svelte';
  import CreateServiceTile from './CreateServiceTile.svelte';
  import CreateServiceDropdown from './CreateServiceDropdown.svelte';

  type Props = {
    clusterId: string;
  };

  const { clusterId }: Props = $props();

  const GRID_CLASS =
    'bg-hairline border-hairline grid shrink-0 grid-cols-1 gap-px border-b sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4';

  const sm = new MediaQuery('min-width: 640px');
  const lg = new MediaQuery('min-width: 1024px');
  const xxl = new MediaQuery('min-width: 1536px');

  const cluster = $derived(clustersState.get(clusterId));
  const entries = $derived(serviceEntries(cluster));
  const tiles = $derived(listServices(entries));
  const columns = $derived(
    xxl.current ? 4 : lg.current ? 3 : sm.current ? 2 : 1,
  );

  let isFormOpen = $state(false);

  $effect(() => {
    const syncedClusterId = clusterId;
    void untrack(() => monitoringState.sync(syncedClusterId));

    return () => {
      monitoringState.unsync();
    };
  });

  function getStatus(projectId: string): ServiceStatus {
    return getStatusFromMonitor(
      monitoringState.getMonitorByProjectId(projectId),
    );
  }

  function fillerSpan(cells: number): number {
    return (columns - (cells % columns)) % columns;
  }

  function onOpenForm(): void {
    isFormOpen = true;
  }

  function onCloseForm(): void {
    isFormOpen = false;
  }
</script>

<PaneHeader title="Services">
  <span class="tabular-nums">
    {tiles.services.length}
    {tiles.services.length === 1 ? 'service' : 'services'}
  </span>
</PaneHeader>

{#if entries.length === 0}
  <EmptyState
    class="p-4"
    title="No services yet"
    description="Add the parts of your domain, like a website, an API or a worker."
  >
    <div class="relative">
      <Button variant="primary" size="sm" onclick={onOpenForm}>
        <PlusIcon class="size-4" />
        New service
      </Button>

      {#if isFormOpen}
        <CreateServiceDropdown
          {clusterId}
          onClose={onCloseForm}
          inputId="empty-state-service-name-input"
        />
      {/if}
    </div>
  </EmptyState>
{:else}
  <div class={GRID_CLASS}>
    {#each tiles.services as item (item.id)}
      {@render serviceTile(item)}
    {/each}

    <CreateServiceTile {clusterId} />

    {@render filler(tiles.services.length + 1)}
  </div>

  {#if tiles.dependencies.length > 0}
    <PaneHeader title="Dependencies">
      <span class="tabular-nums">
        {tiles.dependencies.length}
        {tiles.dependencies.length === 1 ? 'dependency' : 'dependencies'}
      </span>
    </PaneHeader>

    <div class={GRID_CLASS}>
      {#each tiles.dependencies as item (item.id)}
        {@render serviceTile(item)}
      {/each}

      {@render filler(tiles.dependencies.length)}
    </div>
  {/if}
{/if}

{#snippet serviceTile(item: ServiceItem)}
  <ServiceTile
    name={item.label}
    url={item.urlLabel}
    status={getStatus(item.id)}
    {clusterId}
    projectId={item.id}
  >
    <ServiceErrorsBadge projectId={item.id} />
  </ServiceTile>
{/snippet}

{#snippet filler(cells: number)}
  {@const span = fillerSpan(cells)}
  {#if span > 0}
    <div
      class="bg-surface-elevated"
      style:grid-column="span {span} / span {span}"
      aria-hidden="true"
    ></div>
  {/if}
{/snippet}
