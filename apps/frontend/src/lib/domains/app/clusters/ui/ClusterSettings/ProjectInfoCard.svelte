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
  import { Button, Input } from '@logdash/hyper-ui/presentational';

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

    try {
      await clustersState.update(clusterId, { name: newName });
      toast.success('Project name updated successfully', 5000);
      isEditingName = false;
    } catch {
      toast.error('Failed to update project name', 5000);
    }
  }

  async function onCopyProjectId(): Promise<void> {
    await navigator.clipboard.writeText(clusterId);
    toast.success('Project ID copied to clipboard', 5000);
  }

  function onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter') void onSaveRename();
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
      <p class="text-neutral-400 text-sm">Project Name</p>
      {#if isEditingName}
        <Input
          bind:value={newName}
          size="sm"
          class="mt-1 w-64"
          placeholder="Enter project name"
          onkeydown={onKeydown}
        />
      {:else}
        <p class="font-medium">{cluster?.name || 'Unknown'}</p>
      {/if}

      {#snippet action()}
        {#if isEditingName}
          <Button
            variant="ghost"
            size="sm"
            onclick={onCancelRenaming}
            disabled={clustersState.isUpdating}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onclick={onSaveRename}
            loading={clustersState.isUpdating}
          >
            Save
          </Button>
        {:else}
          <Button
            variant="ghost"
            size="sm"
            class="text-neutral-400"
            onclick={onStartRenaming}
          >
            Rename
            <ChevronRightIcon class="h-4 w-4" />
          </Button>
        {/if}
      {/snippet}
    </SettingsCardItem>

    <SettingsCardItem icon={PaletteIcon}>
      <p class="text-neutral-400 text-sm">Project Color</p>
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
            <p class="text-neutral-500 text-sm">No color set</p>
          {/if}
        </div>
      {/if}

      {#snippet action()}
        {#if isEditingColor}
          <Button
            variant="ghost"
            size="sm"
            onclick={onCancelEditingColor}
            disabled={clustersState.isUpdating}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onclick={onSaveColor}
            loading={clustersState.isUpdating}
          >
            Save
          </Button>
        {:else}
          <Button
            variant="ghost"
            size="sm"
            class="text-neutral-400"
            onclick={onStartEditingColor}
          >
            Change
            <ChevronRightIcon class="h-4 w-4" />
          </Button>
        {/if}
      {/snippet}
    </SettingsCardItem>

    <SettingsCardItem icon={HashIcon} showBorder={false}>
      <p class="text-neutral-400 text-sm">Project ID</p>
      <p class="font-mono text-sm">{clusterId}</p>

      {#snippet action()}
        <Button
          variant="ghost"
          size="sm"
          class="text-neutral-400"
          onclick={onCopyProjectId}
        >
          <CopyIcon class="h-4 w-4" />
        </Button>
      {/snippet}
    </SettingsCardItem>
  </div>
</SettingsCard>
