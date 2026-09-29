<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import {
    SettingsCardExpandable,
    SettingsCardItem,
  } from '$lib/domains/shared/ui/components/settings-card/index.js';
  import EditIcon from '$lib/domains/shared/icons/EditIcon.svelte';
  import SettingsIcon from '$lib/domains/shared/icons/SettingsIcon.svelte';
  import TrashIcon from '$lib/domains/shared/icons/TrashIcon.svelte';

  type Props = {
    monitorId: string;
    clusterId: string;
    projectId: string;
    onEdit: () => void;
  };

  const { monitorId, clusterId, projectId, onEdit }: Props = $props();

  async function onDeleteMonitor(): Promise<void> {
    if (!confirm('Are you sure you want to delete this monitor?')) {
      return;
    }

    try {
      const onDeleted = toast.info('Deleting monitor...', 60000);
      await monitoringState.deleteMonitor(monitorId);
      onDeleted();
      toast.success('Monitor deleted successfully', 5000);
      void goto(
        resolve('/app/clusters/[cluster_id]/[project_id]', {
          cluster_id: clusterId,
          project_id: projectId,
        }),
      );
    } catch {
      toast.error('Failed to delete monitor', 5000);
    }
  }
</script>

<SettingsCardExpandable
  title="Monitor Settings"
  description="Configure and manage this monitor"
  icon={SettingsIcon}
>
  <SettingsCardItem icon={EditIcon} showBorder={true} onclick={onEdit}>
    <p class="font-medium">Edit monitor</p>
    <p class="text-neutral-400 text-sm">Change the name or the checked URL</p>
  </SettingsCardItem>

  <SettingsCardItem
    icon={TrashIcon}
    iconVariant="danger"
    showBorder={false}
    onclick={onDeleteMonitor}
  >
    <p class="font-medium text-error">Delete Monitor</p>
    <p class="text-neutral-400 text-sm">
      Permanently delete this monitor and all its data
    </p>
  </SettingsCardItem>
</SettingsCardExpandable>
