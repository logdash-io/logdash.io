<script lang="ts">
  import { confirmDialog } from '$lib/domains/shared/ui/confirm/confirm.state.svelte.js';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import type { Monitor } from '$lib/domains/app/projects/domain/monitoring/monitor.js';
  import ShieldCheckIcon from '$lib/domains/shared/icons/ShieldCheckIcon.svelte';
  import TrashIcon from '$lib/domains/shared/icons/TrashIcon.svelte';
  import IconButton from '$lib/domains/shared/ui/components/IconButton.svelte';
  import {
    SettingsCard,
    SettingsCardItem,
  } from '$lib/domains/shared/ui/components/settings-card/index.js';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import { Button } from '@logdash/hyper-ui/presentational';

  type Props = {
    monitor: Monitor;
    clusterId: string;
    onEdit: () => void;
    onGetBadge: () => void;
  };

  const { monitor, clusterId, onEdit, onGetBadge }: Props = $props();

  let isDeleting = $state(false);

  async function onDeleteMonitor(): Promise<void> {
    const confirmed = await confirmDialog.ask({
      title: 'Delete monitor',
      description:
        'Its uptime history and alerts will be deleted. This cannot be undone.',
      confirmLabel: 'Delete monitor',
    });

    if (!confirmed) {
      return;
    }

    isDeleting = true;

    try {
      await monitoringState.deleteMonitor(monitor.id);
      toast.success('Monitor deleted successfully', 5000);
      void goto(
        resolve('/app/domains/[cluster_id]/uptime', { cluster_id: clusterId }),
      );
    } catch {
      toast.error('Failed to delete monitor', 5000);
    } finally {
      isDeleting = false;
    }
  }
</script>

<SettingsCard
  title="Monitor"
  description={monitor.url ? 'Its name, URL and badge.' : 'Its name and badge.'}
>
  {#snippet actions()}
    <IconButton
      label="Delete monitor"
      danger
      well
      class="-mr-1.5"
      disabled={isDeleting}
      onclick={onDeleteMonitor}
    >
      <TrashIcon class="size-4" />
    </IconButton>
  {/snippet}

  <SettingsCardItem>
    {@render field('Name', monitor.name)}

    {#snippet action()}
      <Button size="sm" onclick={onEdit}>Edit</Button>
    {/snippet}
  </SettingsCardItem>

  {#if monitor.url}
    <SettingsCardItem>
      {@render field('URL', monitor.url)}

      {#snippet action()}
        <Button size="sm" onclick={onEdit}>Edit</Button>
      {/snippet}
    </SettingsCardItem>
  {/if}

  <SettingsCardItem>
    {@render field(
      'Badge',
      'Its uptime in a README, linked to your status page.',
      true,
    )}

    {#snippet action()}
      <Button size="sm" onclick={onGetBadge}>
        <ShieldCheckIcon class="size-4" />
        Get badge
      </Button>
    {/snippet}
  </SettingsCardItem>
</SettingsCard>

{#snippet field(label: string, value: string, muted = false)}
  <div class="flex min-w-0 items-center gap-3">
    <span class="text-fg-muted w-16 shrink-0">{label}</span>
    <span class={['truncate', { 'text-fg-muted': muted }]}>{value}</span>
  </div>
{/snippet}
