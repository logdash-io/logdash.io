<script lang="ts">
  import { untrack } from 'svelte';
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
  import { Button } from '@logdash/hyper-ui/presentational';
  import ServiceRow from './ServiceRow.svelte';
  import ServiceErrorsBadge from './ServiceErrorsBadge.svelte';
  import CreateServiceButton from './CreateServiceButton.svelte';
  import CreateServiceDropdown from './CreateServiceDropdown.svelte';

  type Props = {
    clusterId: string;
  };

  const { clusterId }: Props = $props();

  const cluster = $derived(clustersState.get(clusterId));
  const entries = $derived(serviceEntries(cluster));
  const tiles = $derived(listServices(entries));

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

  function onOpenForm(): void {
    isFormOpen = true;
  }

  function onCloseForm(): void {
    isFormOpen = false;
  }
</script>

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
  <div class="flex flex-col gap-6 p-2">
    <section class="flex flex-col gap-0.5">
      {@render groupHeader('Services', tiles.services.length, true)}

      {#each tiles.services as item (item.id)}
        {@render serviceRow(item)}
      {/each}
    </section>

    {#if tiles.dependencies.length > 0}
      <section class="flex flex-col gap-0.5">
        {@render groupHeader('Dependencies', tiles.dependencies.length, false)}

        {#each tiles.dependencies as item (item.id)}
          {@render serviceRow(item)}
        {/each}
      </section>
    {/if}
  </div>
{/if}

{#snippet groupHeader(title: string, count: number, canAdd: boolean)}
  <div
    class="bg-surface-100-bg relative flex h-9 shrink-0 items-center gap-2 rounded-lg pr-1 pl-3 text-[13px] font-medium"
  >
    <h2>{title}</h2>
    <span class="text-fg-muted tabular-nums">{count}</span>

    {#if canAdd}
      <span class="ml-auto">
        <CreateServiceButton {clusterId} />
      </span>
    {/if}
  </div>
{/snippet}

{#snippet serviceRow(item: ServiceItem)}
  <ServiceRow
    name={item.label}
    url={item.urlLabel}
    status={getStatus(item.id)}
    {clusterId}
    projectId={item.id}
  >
    <ServiceErrorsBadge projectId={item.id} />
  </ServiceRow>
{/snippet}
