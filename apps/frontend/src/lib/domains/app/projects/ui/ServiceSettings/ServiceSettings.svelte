<script lang="ts">
  import { goto } from '$app/navigation';
  import { projectsState } from '$lib/domains/app/projects/application/projects.state.svelte.js';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import {
    CopyIcon,
    KeyIcon,
    PenLineIcon,
    Trash2Icon,
    ChevronRightIcon,
    AlertTriangleIcon,
  } from 'lucide-svelte';

  type Props = {
    clusterId: string;
    projectId: string;
  };

  const { clusterId, projectId }: Props = $props();

  const project = $derived(
    clustersState.clusters
      .find((c) => c.id === clusterId)
      ?.projects.find((p) => p.id === projectId),
  );

  let newName = $state('');
  let isEditingName = $state(false);

  $effect(() => {
    if (project?.name) {
      newName = project.name;
    }
  });

  function onCopyApiKey(): void {
    projectsState.getApiKey(projectId).then((key) => {
      navigator.clipboard.writeText(key);
      toast.success('API key copied to clipboard', 5000);
    });
  }

  function onStartRenaming(): void {
    isEditingName = true;
  }

  function onCancelRenaming(): void {
    isEditingName = false;
    newName = project?.name || '';
  }

  function onSaveRename(): void {
    if (!newName || newName.trim() === '') {
      toast.warning('Service name cannot be empty', 5000);
      return;
    }

    if (newName === project?.name) {
      isEditingName = false;
      return;
    }

    projectsState.updateProject(projectId, newName).then(() => {
      toast.success('Service name updated successfully', 5000);
      isEditingName = false;
    });
  }

  function onDeleteService(): void {
    if (
      !confirm(
        'Are you sure you want to delete this service? This action cannot be undone.',
      )
    ) {
      return;
    }

    projectsState.deleteProject(projectId).then(() => {
      goto(`/app/clusters/${clusterId}`);
      toast.success('Service deleted successfully', 5000);
    });
  }
</script>

<div class="flex w-full max-w-2xl flex-col gap-6">
  <div class="ld-card-base overflow-hidden rounded-3xl">
    <div class="border-b border-base-100 px-6 py-4">
      <h2 class="text-lg font-semibold">API Keys</h2>
      <p class="text-base-content/60 text-sm">
        Access keys for integrating with this service
      </p>
    </div>

    <button
      onclick={onCopyApiKey}
      disabled={projectsState.isLoadingApiKey(projectId)}
      class="flex w-full cursor-pointer items-center justify-between px-6 py-4 transition-colors hover:bg-base-100/50"
    >
      <div class="flex items-center gap-4">
        <div class="rounded-lg bg-base-100 p-2.5">
          <KeyIcon class="h-5 w-5 text-base-content/70" />
        </div>
        <div class="text-left">
          <p class="font-medium">Service API Key</p>
          <p class="text-base-content/60 text-sm">
            Click to copy the API key to clipboard
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2 text-base-content/60">
        {#if projectsState.isLoadingApiKey(projectId)}
          <span class="loading loading-spinner loading-sm"></span>
        {:else}
          <CopyIcon class="h-5 w-5" />
        {/if}
      </div>
    </button>
  </div>

  <div class="ld-card-base overflow-hidden rounded-3xl">
    <div class="border-b border-base-100 px-6 py-4">
      <h2 class="text-lg font-semibold">Service Information</h2>
      <p class="text-base-content/60 text-sm">
        Basic details about your service
      </p>
    </div>

    <div class="flex flex-col">
      <div
        class="flex items-center justify-between border-b border-base-100/50 px-6 py-4"
      >
        <div class="flex items-center gap-4">
          <div class="rounded-lg bg-base-100 p-2.5">
            <PenLineIcon class="h-5 w-5 text-base-content/70" />
          </div>
          <div>
            <p class="text-base-content/60 text-sm">Service Name</p>
            {#if isEditingName}
              <input
                bind:value={newName}
                class="input input-sm mt-1 w-64"
                placeholder="Enter service name"
                onkeydown={(e) => {
                  if (e.key === 'Enter') onSaveRename();
                  if (e.key === 'Escape') onCancelRenaming();
                }}
              />
            {:else}
              <p class="font-medium">{project?.name || 'Unknown'}</p>
            {/if}
          </div>
        </div>
        <div class="flex items-center gap-2">
          {#if isEditingName}
            <button
              onclick={onCancelRenaming}
              class="btn btn-ghost btn-sm"
              disabled={projectsState.isUpdatingProject(projectId)}
            >
              Cancel
            </button>
            <button
              onclick={onSaveRename}
              class="btn btn-primary btn-sm"
              disabled={projectsState.isUpdatingProject(projectId)}
            >
              {#if projectsState.isUpdatingProject(projectId)}
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
        </div>
      </div>

      <div class="flex items-center justify-between px-6 py-4">
        <div class="flex items-center gap-4">
          <div class="rounded-lg bg-base-100 p-2.5">
            <KeyIcon class="h-5 w-5 text-base-content/70" />
          </div>
          <div>
            <p class="text-base-content/60 text-sm">Service ID</p>
            <p class="font-mono text-sm">{projectId}</p>
          </div>
        </div>
        <button
          onclick={() => {
            navigator.clipboard.writeText(projectId);
            toast.success('Service ID copied to clipboard', 5000);
          }}
          class="btn btn-ghost btn-sm text-base-content/60"
        >
          <CopyIcon class="h-4 w-4" />
        </button>
      </div>
    </div>
  </div>

  <div class="overflow-hidden rounded-3xl border border-error/20">
    <div class="border-b border-error/20 bg-error/5 px-6 py-4">
      <div class="flex items-center gap-2">
        <AlertTriangleIcon class="h-5 w-5 text-error" />
        <h2 class="text-lg font-semibold text-error">Danger Zone</h2>
      </div>
      <p class="text-base-content/60 mt-1 text-sm">
        Irreversible actions that affect your service
      </p>
    </div>

    <div class="flex items-center justify-between px-6 py-4">
      <div class="flex items-center gap-4">
        <div class="rounded-lg bg-error/10 p-2.5">
          <Trash2Icon class="h-5 w-5 text-error" />
        </div>
        <div>
          <p class="font-medium">Delete Service</p>
          <p class="text-base-content/60 text-sm">
            Permanently delete this service and all its data
          </p>
        </div>
      </div>
      <button
        onclick={onDeleteService}
        disabled={projectsState.isDeletingProject(projectId)}
        class="btn btn-error btn-outline btn-sm"
      >
        {#if projectsState.isDeletingProject(projectId)}
          <span class="loading loading-spinner loading-xs"></span>
        {:else}
          Delete
        {/if}
      </button>
    </div>
  </div>
</div>
