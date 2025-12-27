<script lang="ts">
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import ColorPalette from '$lib/domains/app/clusters/ui/ClusterWizard/ColorPalette.svelte';
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
  import PaletteIcon from '$lib/domains/shared/icons/PaletteIcon.svelte';

  type Props = {
    clusterId: string;
  };

  const { clusterId }: Props = $props();

  const cluster = $derived(clustersState.get(clusterId));

  let newName = $state('');
  let isEditingName = $state(false);
  let isEditingColor = $state(false);
  let originalColor = $state<string | undefined>('');

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

  function onStartEditingColor(): void {
    originalColor = cluster?.color;
    isEditingColor = true;
  }

  function onCancelEditingColor(): void {
    clustersState.setColorPreview(clusterId, originalColor);
    isEditingColor = false;
  }

  function onColorSelect(color: string): void {
    clustersState.setColorPreview(clusterId, color);
  }

  async function onSaveColor(): Promise<void> {
    const currentColor = cluster?.color;
    if (currentColor === originalColor) {
      isEditingColor = false;
      return;
    }

    await clustersState.update(clusterId, { color: currentColor });
    toast.success('Project color updated successfully', 5000);
    isEditingColor = false;
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

    <SettingsCardItem icon={PaletteIcon}>
      {#snippet children()}
        <p class="text-base-content/60 text-sm">Project Color</p>
        {#if isEditingColor}
          <div class="mt-2">
            <ColorPalette
              selectedColor={cluster?.color ?? ''}
              onSelect={onColorSelect}
            />
          </div>
        {:else}
          <div class="flex items-center gap-2">
            {#if cluster?.color}
              <div
                class="size-3.5 rounded-md"
                style="background-color: {cluster.color}"
              ></div>
              <p class="font-mono text-sm">{cluster.color}</p>
            {:else}
              <p class="text-base-content/50 text-sm">No color set</p>
            {/if}
          </div>
        {/if}
      {/snippet}

      {#snippet action()}
        {#if isEditingColor}
          <button
            onclick={onCancelEditingColor}
            class="btn btn-ghost btn-sm"
            disabled={clustersState.isUpdating}
          >
            Cancel
          </button>
          <button
            onclick={onSaveColor}
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
            onclick={onStartEditingColor}
            class="btn btn-ghost btn-sm text-base-content/60"
          >
            Change
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
