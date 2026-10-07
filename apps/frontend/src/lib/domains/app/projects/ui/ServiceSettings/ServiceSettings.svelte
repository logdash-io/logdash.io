<script lang="ts">
  import CubeIcon from '$lib/domains/shared/icons/CubeIcon.svelte';
  import KeyIcon from '$lib/domains/shared/icons/KeyIcon.svelte';
  import TrashIcon from '$lib/domains/shared/icons/TrashIcon.svelte';
  import { confirmDialog } from '$lib/domains/shared/ui/confirm/confirm.state.svelte.js';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { projectsState } from '$lib/domains/app/projects/application/projects.state.svelte.js';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import {
    SETTINGS_INPUT_CLASS,
    SETTINGS_PAGE_CLASS,
    SettingsCard,
    SettingsCardItem,
    SettingsToc,
  } from '$lib/domains/shared/ui/components/settings-card/index.js';
  import { readHttpErrorMessage } from '$lib/domains/shared/http/http-error';
  import CopyIcon from '$lib/domains/shared/icons/CopyIcon.svelte';
  import IconButton from '$lib/domains/shared/ui/components/IconButton.svelte';
  import { Button, Input } from '@logdash/hyper-ui/presentational';

  type Props = {
    clusterId: string;
    projectId: string;
  };

  const { clusterId, projectId }: Props = $props();

  const project = $derived(
    clustersState.clusters
      .find((c) => c.id === clusterId)
      ?.projects?.find((p) => p.id === projectId),
  );

  let newName = $state('');
  let isEditingName = $state(false);

  async function onCopyApiKey(): Promise<void> {
    try {
      const key = await projectsState.getApiKey(projectId);
      await navigator.clipboard.writeText(key);
      toast.success('API key copied to clipboard', 5000);
    } catch (error) {
      const message = readHttpErrorMessage(error) ?? 'Something went wrong';
      toast.error(`Failed to copy the API key: ${message}`, 5000);
    }
  }

  async function onCopyServiceId(): Promise<void> {
    await navigator.clipboard.writeText(projectId);
    toast.success('Service ID copied to clipboard', 5000);
  }

  function onStartRenaming(): void {
    newName = project?.name ?? '';
    isEditingName = true;
  }

  function onCancelRenaming(): void {
    isEditingName = false;
  }

  async function onSaveRename(): Promise<void> {
    if (!newName || newName.trim() === '') {
      toast.warning('Service name cannot be empty', 5000);
      return;
    }

    if (newName === project?.name) {
      isEditingName = false;
      return;
    }

    try {
      await projectsState.updateProject(projectId, newName);
      toast.success('Service name updated', 5000);
      isEditingName = false;
    } catch {
      toast.error('Failed to update the service name', 5000);
    }
  }

  async function onDeleteService(): Promise<void> {
    const confirmed = await confirmDialog.ask({
      title: 'Delete service',
      description:
        'Its logs, metrics and API keys will be deleted. Monitors stay on the domain. This cannot be undone.',
      confirmLabel: 'Delete service',
    });

    if (!confirmed) {
      return;
    }

    try {
      await projectsState.deleteProject(projectId);
      await clustersState.load();
      void goto(
        resolve('/app/domains/[cluster_id]/services', {
          cluster_id: clusterId,
        }),
      );
      toast.success('Service deleted', 5000);
    } catch (error) {
      const message = readHttpErrorMessage(error) ?? 'Something went wrong';
      toast.error(`Failed to delete service: ${message}`, 5000);
    }
  }

  function onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter') {
      void onSaveRename();
    }

    if (e.key === 'Escape') {
      onCancelRenaming();
    }
  }
</script>

<div class={SETTINGS_PAGE_CLASS}>
  <SettingsToc />

  <SettingsCard
    title="API key"
    description="Your app sends data with it."
    icon={KeyIcon}
  >
    <SettingsCardItem>
      <div class="flex min-w-0 items-center gap-3">
        <span class="text-fg-muted w-16 shrink-0">Key</span>
        <span class="text-fg-muted truncate font-mono" aria-hidden="true">
          ••••••••••••••••
        </span>
      </div>

      {#snippet action()}
        <Button
          size="sm"
          onclick={onCopyApiKey}
          loading={projectsState.isLoadingApiKey(projectId)}
        >
          <CopyIcon class="size-4" />
          Copy
        </Button>
      {/snippet}
    </SettingsCardItem>
  </SettingsCard>

  <SettingsCard title="Service" description="Its name and ID." icon={CubeIcon}>
    <SettingsCardItem>
      <div class="flex min-w-0 items-center gap-3">
        <span class="text-fg-muted w-16 shrink-0">Name</span>
        {#if isEditingName}
          <Input
            bind:value={newName}
            size="sm"
            class={['-my-1.5 w-full max-w-64', SETTINGS_INPUT_CLASS]}
            placeholder="Service name"
            aria-label="Service name"
            autofocus
            onkeydown={onKeyDown}
          />
        {:else}
          <span class="truncate">{project?.name || 'Unknown'}</span>
        {/if}
      </div>

      {#snippet action()}
        {#if isEditingName}
          <Button
            variant="ghost"
            size="sm"
            onclick={onCancelRenaming}
            disabled={projectsState.isUpdatingProject(projectId)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onclick={onSaveRename}
            loading={projectsState.isUpdatingProject(projectId)}
          >
            Save
          </Button>
        {:else}
          <Button size="sm" onclick={onStartRenaming}>Rename</Button>
        {/if}
      {/snippet}
    </SettingsCardItem>

    <SettingsCardItem>
      <div class="flex min-w-0 items-center gap-3">
        <span class="text-fg-muted w-16 shrink-0">ID</span>
        <span class="truncate font-mono">{projectId}</span>
      </div>

      {#snippet action()}
        <IconButton
          label="Copy service ID"
          class="-mr-1.5"
          onclick={onCopyServiceId}
        >
          <CopyIcon class="size-4" />
        </IconButton>
      {/snippet}
    </SettingsCardItem>
  </SettingsCard>

  <SettingsCard
    title="Danger zone"
    icon={TrashIcon}
    description="Actions that cannot be undone."
    variant="danger"
  >
    <SettingsCardItem>
      <p>Delete service</p>
      <p class="text-fg-muted">
        Removes its logs, metrics and API keys. Monitors stay on the domain.
      </p>

      {#snippet action()}
        <Button
          variant="danger"
          size="sm"
          onclick={onDeleteService}
          loading={projectsState.isDeletingProject(projectId)}
        >
          Delete
        </Button>
      {/snippet}
    </SettingsCardItem>
  </SettingsCard>
</div>
