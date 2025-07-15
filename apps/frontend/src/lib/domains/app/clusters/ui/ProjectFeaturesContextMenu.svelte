<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { projectsState } from '$lib/domains/app/projects/application/projects.state.svelte.js';
  import SetupMonitoringButton from '$lib/domains/app/projects/ui/presentational/SetupMonitoringButton.svelte';
  import { Feature } from '$lib/domains/shared/types.js';
  import { Tooltip } from '@logdash/hyper-ui/presentational';
  import { PlusIcon } from 'lucide-svelte';
  import { fly } from 'svelte/transition';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';

  type Props = {
    clusterId: string;
  };
  const { clusterId }: Props = $props();
  const projectId = $derived(page.url.searchParams.get('project_id'));

  const hasLogging = $derived(
    projectsState.hasFeature(projectId, Feature.LOGGING),
  );
  const hasMetrics = $derived(
    projectsState.hasFeature(projectId, Feature.METRICS),
  );
  const hasMonitoring = $derived(
    projectsState.hasFeature(projectId, Feature.MONITORING),
  );
</script>

{#snippet menu(close: () => void)}
  <ul
    class="menu dropdown-content text-secondary ld-card-base rounded-box z-1 w-fit whitespace-nowrap p-2 shadow"
  >
    {#if !hasLogging && projectsState.ready}
      <li class="py-0.5">
        <button
          in:fly={{ y: -2, duration: 100 }}
          onclick={() => {
            goto(
              `/app/clusters/${clusterId}/configure/logging?project_id=${page.url.searchParams.get('project_id')}`,
            );
          }}
          class="flex w-full items-center justify-between"
        >
          Add logging
          <PlusIcon class="h-4 w-4" />
        </button>
      </li>
    {/if}

    {#if !hasMetrics && projectsState.ready}
      <li class="py-0.5">
        <button
          in:fly={{ y: -2, duration: 100 }}
          onclick={() => {
            goto(
              `/app/clusters/${clusterId}/configure/metrics?project_id=${page.url.searchParams.get('project_id')}`,
            );
          }}
          class="flex w-full items-center justify-between"
        >
          Add metrics
          <PlusIcon class="h-4 w-4" />
        </button>
      </li>
    {/if}

    {#if !hasMonitoring && clustersState.ready}
      <li class="py-0.5">
        <SetupMonitoringButton
          class="flex w-full items-center justify-between"
          canAddMore={true}
          onSubmit={(url) => {
            goto(
              `/app/clusters/${clusterId}/configure/monitoring?project_id=${page.url.searchParams.get(
                'project_id',
              )}&url=${encodeURIComponent(url)}`,
            );
          }}
        >
          Add monitoring
          <PlusIcon class="h-4 w-4" />
        </SetupMonitoringButton>
      </li>
    {/if}
  </ul>
{/snippet}

{#if (!hasLogging || !hasMetrics || !hasMonitoring) && projectsState.ready}
  <Tooltip content={menu} interactive={true} placement="bottom" trigger="click">
    <button
      class="btn ld-card-base gap-1 rounded-full"
      data-posthog-id="cluster-settings-button"
      onclick={(e) => {
        e.stopPropagation();
      }}
    >
      <span>More features</span>
      <PlusIcon class="h-5 w-5" />
    </button>
  </Tooltip>
{/if}
