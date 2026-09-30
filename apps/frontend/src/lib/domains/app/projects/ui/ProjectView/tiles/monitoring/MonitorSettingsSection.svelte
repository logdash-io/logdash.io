<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import EditIcon from '$lib/domains/shared/icons/EditIcon.svelte';
  import {
    SettingsCard,
    SettingsCardItem,
  } from '$lib/domains/shared/ui/components/settings-card/index.js';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import { Button } from '@logdash/hyper-ui/presentational';

  type Props = {
    monitorId: string;
    clusterId: string;
    projectId: string;
    onEdit: () => void;
  };

  const { monitorId, clusterId, projectId, onEdit }: Props = $props();

  let isDeleting = $state(false);

  async function onDeleteMonitor(): Promise<void> {
    if (!confirm('Are you sure you want to delete this monitor?')) {
      return;
    }

    isDeleting = true;

    try {
      await monitoringState.deleteMonitor(monitorId);
      toast.success('Monitor deleted successfully', 5000);
      void goto(
        resolve('/app/domains/[cluster_id]/[project_id]', {
          cluster_id: clusterId,
          project_id: projectId,
        }),
      );
    } catch {
      toast.error('Failed to delete monitor', 5000);
    } finally {
      isDeleting = false;
    }
  }
</script>

<SettingsCard
  title="Monitor settings"
  description="Change what is checked, or remove it."
>
  <SettingsCardItem>
    <p>Edit monitor</p>
    <p class="text-neutral-500">Change the name or the checked URL.</p>

    {#snippet action()}
      <Button variant="neutral" size="sm" onclick={onEdit}>
        <EditIcon class="size-4" />
        Edit
      </Button>
    {/snippet}
  </SettingsCardItem>

  <SettingsCardItem>
    <p>Delete monitor</p>
    <p class="text-neutral-500">
      Removes this monitor with all its checks and uptime history.
    </p>

    {#snippet action()}
      <Button
        variant="danger"
        size="sm"
        loading={isDeleting}
        onclick={onDeleteMonitor}
      >
        Delete
      </Button>
    {/snippet}
  </SettingsCardItem>
</SettingsCard>
