<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { toast } from '$lib/shared/ui/toaster/toast.state.svelte.js';
  import { CopyIcon, MoreVerticalIcon, PenLineIcon, Trash2Icon } from 'lucide-svelte';
  import { projectsState } from '../../application/projects.state.svelte.js';
  import Tooltip from '$lib/shared/ui/components/Tooltip.svelte';

  const { project } = $props();
</script>

{#snippet menu(close: () => void)}
  <ul
    class="menu dropdown-content text-secondary ld-card-base rounded-box z-1 mt-1 w-fit whitespace-nowrap p-2 shadow"
  >
    <li>
      <a
        onclick={() => {
          projectsState.getApiKey(project.id).then((key) => {
            navigator.clipboard.writeText(key);
            toast.success('Service API key copied to clipboard', 5000);
          });
          close();
        }}
        class="whitespace-nowrap"
      >
        Copy service api key

        {#if projectsState.isLoadingApiKey(project.id)}
          <span class="loading loading-spinner loading-xs ml-1"></span>
        {:else}
          <CopyIcon class="ml-1.5 h-3.5 w-3.5" />
        {/if}
      </a>
    </li>

    <li>
      <a
        onclick={() => {
          const newName = prompt('Enter new service name', project.name);
          close();

          if (!newName || newName.trim() === '') {
            toast.warning('Service name cannot be empty', 5000);
            return;
          }

          if (newName === project.name) {
            toast.info('Service name is the same, no changes made', 5000);
            return;
          }

          projectsState.updateProject(project.id, newName).then((key) => {
            toast.success('Service name updated successfully', 5000);
          });
        }}
        class="whitespace-nowrap"
      >
        Rename service

        {#if projectsState.isUpdatingProject(project.id)}
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
            !confirm('Are you sure you want to delete this service?') ||
            projectsState.isDeletingProject(project.id)
          ) {
            close();
            return;
          }

          projectsState.deleteProject(project.id).then((key) => {
            goto(`/app/clusters/${page.params.cluster_id}`);
            toast.success('Project deleted successfully', 5000);
          });
          close();
        }}
        class="text-error whitespace-nowrap"
      >
        Delete service

        {#if projectsState.isDeletingProject(project.id)}
          <span class="loading loading-spinner loading-xs ml-auto"></span>
        {:else}
          <Trash2Icon class="ml-auto h-4 w-4" />
        {/if}
      </a>
    </li>
  </ul>
{/snippet}

<Tooltip
  content={menu}
  interactive={true}
  placement="bottom"
>
  <div
    class="btn btn-circle btn-transparent mr-0.5 aspect-square h-full w-fit shrink-0"
    onclick={(e) => e.stopPropagation()}
    role="button"
    tabindex="0"
  >
    <MoreVerticalIcon class="h-4 w-4 shrink-0" />
  </div>
</Tooltip>
