<script lang="ts">
  import { goto } from '$app/navigation';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import {
    SettingsCard,
    SettingsCardHeader,
    SettingsCardItem,
  } from '$lib/domains/shared/ui/components/settings-card';
  import TrashIcon from '$lib/domains/shared/icons/TrashIcon.svelte';
  import { DangerIcon } from '@logdash/hyper-ui/icons';

  type Props = {
    clusterId: string;
  };

  const { clusterId }: Props = $props();

  async function onDeleteProject(): Promise<void> {
    const confirmed = confirm(
      'Are you sure you want to delete this project? This action cannot be undone and will delete all services and data.',
    );

    if (!confirmed) return;

    const dismissLoading = toast.info('Deleting project...', 60000);

    try {
      await clustersState.delete(clusterId);
      dismissLoading();
      toast.success('Project deleted successfully', 5000);
      goto('/app/clusters');
    } catch (error) {
      dismissLoading();
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to delete project: ${message}`, 5000);
    }
  }
</script>

<SettingsCard variant="danger">
  <SettingsCardHeader
    title="Danger Zone"
    description="Irreversible actions that affect your project"
    icon={DangerIcon}
    variant="danger"
  />

  <div class="ld-card-bg">
    <SettingsCardItem icon={TrashIcon} iconVariant="danger" showBorder={false}>
      {#snippet children()}
        <p class="font-medium">Delete Project</p>
        <p class="text-base-content/60 text-sm">
          Permanently delete this project and all its services
        </p>
      {/snippet}

      {#snippet action()}
        <button
          onclick={onDeleteProject}
          disabled={clustersState.isDeleting}
          class="btn btn-error btn-outline btn-sm"
        >
          {#if clustersState.isDeleting}
            <span class="loading loading-spinner loading-xs"></span>
          {:else}
            Delete
          {/if}
        </button>
      {/snippet}
    </SettingsCardItem>
  </div>
</SettingsCard>
