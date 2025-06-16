<script lang="ts">
  import { goto } from '$app/navigation';
  import Tooltip from '$lib/shared/ui/components/Tooltip.svelte';
  import { toast } from '$lib/shared/ui/toaster/toast.state.svelte.js';
  import { isDev } from '$lib/shared/utils/is-dev.util.js';
  import { CopyIcon, PenLineIcon, SettingsIcon } from 'lucide-svelte';
  import { clustersState } from '../application/clusters.state.svelte.js';

  const { cluster } = $props();
</script>

{#snippet menu(close: () => void)}
  <ul
    class="menu dropdown-content text-secondary bg-base-100 rounded-box z-1 w-fit whitespace-nowrap p-2 shadow"
  >
    {#if isDev()}
      <li>
        <a
          onclick={() => {
            goto(`/app/clusters/${cluster.id}/configure/public-dashboard`);
            close();
          }}
          class="whitespace-nowrap"
        >
          Configure public dashboard

          <CopyIcon class="ml-1.5 h-3.5 w-3.5" />
        </a>
      </li>
    {/if}

    <li>
      <a
        onclick={(e) => {
          e.stopPropagation();
          const newName = prompt('Enter new project name', cluster.name);
          close();

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

    <!-- <li>
      <a
        onclick={() => {
          // if (
          //   !confirm('Are you sure you want to delete this project?') ||
          //   projectsState.isDeletingProject(project.id)
          // ) {
          //   close();
          //   return;
          // }

          // projectsState.deleteProject(project.id).then((key) => {
          //   goto(`/app/clusters/${page.params.cluster_id}`);
          //   toast.success('Project deleted successfully', 5000);
          // });
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
    </li> -->
  </ul>
{/snippet}

<Tooltip
  align="left"
  content={menu}
  placement="bottom"
  trigger="click"
  interactive={true}
>
  <button
    onclick={(e) => {
      e.stopPropagation();
    }}
    class="btn btn-circle gap-1 text-white"
    data-posthog-id="cluster-settings-button"
  >
    <SettingsIcon class="h-5 w-5" />
  </button>
</Tooltip>
