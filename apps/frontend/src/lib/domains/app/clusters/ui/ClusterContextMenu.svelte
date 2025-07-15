<script lang="ts">
  import { userState } from '$lib/domains/shared/user/application/user.state.svelte.js';
  import Tooltip from '../../../../../../../../packages/hyper-ui/src/lib/presentational/Tooltip.svelte';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import { PenLineIcon, SettingsIcon, Trash2Icon, Users } from 'lucide-svelte';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import { clusterInvitesState } from '$lib/domains/app/clusters/application/cluster-invites.state.svelte.js';

  type Props = {
    clusterId: string;
  };
  const { clusterId }: Props = $props();
  const cluster = $derived(clustersState.get(clusterId));
</script>

{#snippet menu(close: () => void)}
  <ul
    class="menu dropdown-content text-secondary ld-card-base rounded-box z-1 w-fit whitespace-nowrap p-2 shadow"
  >
    {#if clustersState.isUserClusterCreator(userState.id, clusterId)}
      <li>
        <a
          onclick={(e) => {
            e.stopPropagation();
            close();
            clusterInvitesState.openModal(clusterId);
          }}
          class="whitespace-nowrap"
        >
          Manage team
          <Users class="ml-auto h-4 w-4" />
        </a>
      </li>
    {/if}

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
