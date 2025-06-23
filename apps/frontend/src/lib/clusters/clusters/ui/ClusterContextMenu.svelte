<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { projectsState } from '$lib/clusters/projects/application/projects.state.svelte.js';
  import SetupMonitoringButton from '$lib/clusters/projects/ui/presentational/SetupMonitoringButton.svelte';
  import { Feature } from '$lib/shared/types.js';
  import Tooltip from '$lib/shared/ui/components/Tooltip.svelte';
  import { toast } from '$lib/shared/ui/toaster/toast.state.svelte.js';
  import { userState } from '$lib/shared/user/application/user.state.svelte.js';
  import {
    PenLineIcon,
    PlusIcon,
    SettingsIcon,
    Trash2Icon,
  } from 'lucide-svelte';
  import { fly } from 'svelte/transition';
  import { clustersState } from '../application/clusters.state.svelte.js';

  type Props = {
    clusterId: string;
  };
  const { clusterId }: Props = $props();
  const cluster = $derived(clustersState.get(clusterId));
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
    {#if projectId}
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

      {#if userState.hasEarlyAccess && !hasMonitoring && clustersState.ready}
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
    {/if}

    {#if !projectId}
      <li>
        <a
          onclick={(e) => {
            e.stopPropagation();
            const newName = prompt('Enter new project name', cluster.name);
            const hasCancelled = newName === null;
            close();

            if (hasCancelled) {
              return;
            }

            if (!newName || newName.trim() === '') {
              toast.warning('Project name cannot be empty', 5000);
              return;
            }

            if (newName === cluster.name) {
              toast.info('Project name is the same, no changes made', 5000);
              return;
            }

            clustersState
              .update(cluster.id, {
                name: newName,
              })
              .then(() => {
                toast.success('Project name updated successfully', 5000);
              });
          }}
          class="whitespace-nowrap"
        >
          Rename project

          {#if clustersState.isUpdating}
            <span class="loading loading-spinner loading-xs ml-auto"></span>
          {:else}
            <PenLineIcon class="ml-auto h-4 w-4" />
          {/if}
        </a>
      </li>

      <li>
        <a
          onclick={() => {
            if (
              !confirm('Are you sure you want to delete this project?') ||
              clustersState.isDeleting
            ) {
              close();
              return;
            }

            const onDeleted = toast.info('Deleting project...', 60000);

            clustersState
              .delete(cluster.id)
              .then((key) => {
                onDeleted();
                toast.success('Project deleted successfully', 5000);
              })
              .catch((error) => {
                toast.error(`Failed to delete project: ${error.message}`, 5000);
              });
            close();
          }}
          class="text-error whitespace-nowrap"
        >
          Delete project

          {#if clustersState.isDeleting}
            <span class="loading loading-spinner loading-xs ml-auto"></span>
          {:else}
            <Trash2Icon class="ml-auto h-4 w-4" />
          {/if}
        </a>
      </li>
    {/if}
  </ul>
{/snippet}

<Tooltip content={menu} interactive={true} placement="bottom">
  <button
    class="btn btn-circle ld-card-base gap-1"
    data-posthog-id="cluster-settings-button"
    onclick={(e) => {
      e.stopPropagation();
    }}
  >
    <SettingsIcon class="h-5 w-5" />
  </button>
</Tooltip>
