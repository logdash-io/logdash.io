<script lang="ts">
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import {
    SettingsCard,
    SettingsCardHeader,
    SettingsCardItem,
  } from '$lib/domains/shared/ui/components/settings-card';
  import CopyIcon from '$lib/domains/shared/icons/CopyIcon.svelte';
  import EditIcon from '$lib/domains/shared/icons/EditIcon.svelte';
  import ChevronRightIcon from '$lib/domains/shared/icons/ChevronRightIcon.svelte';
  import HashIcon from '$lib/domains/shared/icons/HashIcon.svelte';

  type Props = {
    clusterId: string;
  };

  const { clusterId }: Props = $props();

  const cluster = $derived(clustersState.get(clusterId));

  let newName = $state('');
  let isEditingName = $state(false);

  $effect(() => {
    if (cluster?.name) {
      newName = cluster.name;
    }
  });

  function onStartRenaming(): void {
    isEditingName = true;
  }

  function onCancelRenaming(): void {
    isEditingName = false;
    newName = cluster?.name || '';
  }

  async function onSaveRename(): Promise<void> {
    if (!newName || newName.trim() === '') {
      toast.warning('Project name cannot be empty', 5000);
      return;
    }

    if (newName === cluster?.name) {
      isEditingName = false;
      return;
    }

    await clustersState.update(clusterId, { name: newName });
    toast.success('Project name updated successfully', 5000);
    isEditingName = false;
  }

  function onCopyProjectId(): void {
    navigator.clipboard.writeText(clusterId);
    toast.success('Project ID copied to clipboard', 5000);
  }

  function onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter') onSaveRename();
    if (e.key === 'Escape') onCancelRenaming();
  }
</script>

<SettingsCard>
  <SettingsCardHeader
    title="Project Information"
    description="Basic details about your project"
  />

  <div class="flex flex-col">
    <SettingsCardItem icon={EditIcon}>
      {#snippet children()}
        <p class="text-base-content/60 text-sm">Project Name</p>
        {#if isEditingName}
          <input
            bind:value={newName}
            class="input input-sm mt-1 w-64"
            placeholder="Enter project name"
            onkeydown={onKeydown}
          />
        {:else}
          <p class="font-medium">{cluster?.name || 'Unknown'}</p>
        {/if}
      {/snippet}

      {#snippet action()}
        {#if isEditingName}
          <button
            onclick={onCancelRenaming}
            class="btn btn-ghost btn-sm"
            disabled={clustersState.isUpdating}
          >
            Cancel
          </button>
          <button
            onclick={onSaveRename}
            class="btn btn-primary btn-sm"
            disabled={clustersState.isUpdating}
          >
            {#if clustersState.isUpdating}
              <span class="loading loading-spinner loading-xs"></span>
            {:else}
              Save
            {/if}
          </button>
        {:else}
          <button
            onclick={onStartRenaming}
            class="btn btn-ghost btn-sm text-base-content/60"
          >
            Rename
            <ChevronRightIcon class="h-4 w-4" />
          </button>
        {/if}
      {/snippet}
    </SettingsCardItem>

    <SettingsCardItem icon={HashIcon} showBorder={false}>
      {#snippet children()}
        <p class="text-base-content/60 text-sm">Project ID</p>
        <p class="font-mono text-sm">{clusterId}</p>
      {/snippet}

      {#snippet action()}
        <button
          onclick={onCopyProjectId}
          class="btn btn-ghost btn-sm text-base-content/60"
        >
          <CopyIcon class="h-4 w-4" />
        </button>
      {/snippet}
    </SettingsCardItem>
  </div>
</SettingsCard>
