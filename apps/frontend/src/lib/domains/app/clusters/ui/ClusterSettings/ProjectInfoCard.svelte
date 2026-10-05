<script lang="ts">
  import GlobeIcon from '$lib/domains/shared/icons/GlobeIcon.svelte';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import ColorPalette from './ColorPalette.svelte';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import { readHttpErrorMessage } from '$lib/domains/shared/http/http-error';
  import {
    SETTINGS_INPUT_CLASS,
    SettingsCard,
    SettingsCardItem,
  } from '$lib/domains/shared/ui/components/settings-card';
  import CopyIcon from '$lib/domains/shared/icons/CopyIcon.svelte';
  import IconButton from '$lib/domains/shared/ui/components/IconButton.svelte';
  import { Button, Input } from '@logdash/hyper-ui/presentational';

  type Props = {
    clusterId: string;
    canEdit: boolean;
  };

  const { clusterId, canEdit }: Props = $props();

  const cluster = $derived(clustersState.get(clusterId));

  let newName = $state('');
  let isEditingName = $state(false);
  let isEditingColor = $state(false);
  let originalColor = $state<string | undefined>('');

  function onStartRenaming(): void {
    newName = cluster?.name ?? '';
    isEditingName = true;
  }

  function onCancelRenaming(): void {
    isEditingName = false;
  }

  async function onSaveRename(): Promise<void> {
    if (!newName || newName.trim() === '') {
      toast.warning('Domain name cannot be empty', 5000);
      return;
    }

    if (newName === cluster?.name) {
      isEditingName = false;
      return;
    }

    try {
      await clustersState.update(clusterId, { name: newName });
      toast.success('Domain name updated', 5000);
      isEditingName = false;
    } catch (error) {
      toast.error(failureMessage('name', error), 5000);
    }
  }

  async function onCopyClusterId(): Promise<void> {
    await navigator.clipboard.writeText(clusterId);
    toast.success('Domain ID copied to clipboard', 5000);
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

    try {
      await clustersState.update(clusterId, { color: currentColor });
      toast.success('Domain color updated', 5000);
      isEditingColor = false;
    } catch (error) {
      toast.error(failureMessage('color', error), 5000);
    }
  }

  function failureMessage(field: 'name' | 'color', error: unknown): string {
    const reason = readHttpErrorMessage(error);
    const message = `Failed to update the domain ${field}`;

    return reason ? `${message}: ${reason}` : message;
  }
</script>

<SettingsCard
  title="Domain"
  description="Its name, color and ID."
  icon={GlobeIcon}
>
  <SettingsCardItem>
    <div class="flex min-w-0 items-center gap-3">
      <span class="text-fg-muted w-16 shrink-0">Name</span>
      {#if isEditingName}
        <Input
          bind:value={newName}
          size="sm"
          class={['-my-1.5 w-full max-w-64', SETTINGS_INPUT_CLASS]}
          placeholder="Domain name"
          aria-label="Domain name"
          autofocus
          onkeydown={onKeydown}
        />
      {:else}
        <span class="truncate">{cluster?.name || 'Unknown'}</span>
      {/if}
    </div>

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
      {:else if canEdit}
        <Button size="sm" onclick={onStartRenaming}>Rename</Button>
      {/if}
    {/snippet}
  </SettingsCardItem>

  <SettingsCardItem>
    <div class="flex min-w-0 items-center gap-3">
      <span class="text-fg-muted w-16 shrink-0">Color</span>
      {#if isEditingColor}
        <ColorPalette
          selectedColor={cluster?.color ?? ''}
          onSelect={onColorSelect}
        />
      {:else if cluster?.color}
        <span class="flex min-w-0 items-center gap-2">
          <span
            class="size-3 shrink-0 rounded-full"
            style:background-color={cluster.color}
          ></span>
          <span class="truncate font-mono">{cluster.color}</span>
        </span>
      {:else}
        <span class="text-fg-muted truncate">None</span>
      {/if}
    </div>

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
      {:else if canEdit}
        <Button size="sm" onclick={onStartEditingColor}>Change</Button>
      {/if}
    {/snippet}
  </SettingsCardItem>

  <SettingsCardItem>
    <div class="flex min-w-0 items-center gap-3">
      <span class="text-fg-muted w-16 shrink-0">ID</span>
      <span class="truncate font-mono">{clusterId}</span>
    </div>

    {#snippet action()}
      <IconButton
        label="Copy domain ID"
        class="-mr-1.5"
        onclick={onCopyClusterId}
      >
        <CopyIcon class="size-4" />
      </IconButton>
    {/snippet}
  </SettingsCardItem>
</SettingsCard>
