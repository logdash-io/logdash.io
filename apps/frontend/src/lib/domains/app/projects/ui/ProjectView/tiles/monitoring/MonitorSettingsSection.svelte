<script lang="ts">
  import { goto } from '$app/navigation';
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
    monitorName: string;
    clusterId: string;
    projectId: string;
  };

  const { monitorId, monitorName, clusterId, projectId }: Props = $props();

  async function onRenameMonitor(): Promise<void> {
    const newName = prompt('Enter new monitor name', monitorName);

    if (newName === null) {
      return;
    }

    if (!newName || newName.trim() === '') {
      toast.warning('Monitor name cannot be empty', 5000);
      return;
    }

    if (newName === monitorName) {
      toast.info('Monitor name is the same, no changes made', 5000);
      return;
    }

    try {
      await monitoringState.updateMonitorName(monitorId, newName);
      toast.success('Monitor name updated successfully', 5000);
    } catch {
      toast.error('Failed to update monitor name', 5000);
    }
  }

  async function onDeleteMonitor(): Promise<void> {
    if (!confirm('Are you sure you want to delete this monitor?')) {
      return;
    }

    try {
      const onDeleted = toast.info('Deleting monitor...', 60000);
      await monitoringState.deleteMonitor(monitorId);
      onDeleted();
      toast.success('Monitor deleted successfully', 5000);
      goto(`/app/clusters/${clusterId}/${projectId}`);
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
  <SettingsCardItem icon={EditIcon} showBorder={true} onclick={onRenameMonitor}>
    {#snippet children()}
      <p class="font-medium">Rename Monitor</p>
      <p class="text-base-content/60 text-sm">
        Change the display name of this monitor
      </p>
    {/snippet}
  </SettingsCardItem>

  <SettingsCardItem
    icon={TrashIcon}
    iconVariant="danger"
    showBorder={false}
    onclick={onDeleteMonitor}
  >
    {#snippet children()}
      <p class="font-medium text-error">Delete Monitor</p>
      <p class="text-base-content/60 text-sm">
        Permanently delete this monitor and all its data
      </p>
    {/snippet}
  </SettingsCardItem>
</SettingsCardExpandable>
