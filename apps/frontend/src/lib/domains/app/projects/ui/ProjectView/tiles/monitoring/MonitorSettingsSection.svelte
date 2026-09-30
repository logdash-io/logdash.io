<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import type { Monitor } from '$lib/domains/app/projects/domain/monitoring/monitor.js';
  import ShieldCheckIcon from '$lib/domains/shared/icons/ShieldCheckIcon.svelte';
  import {
    SettingsCard,
    SettingsCardItem,
  } from '$lib/domains/shared/ui/components/settings-card/index.js';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import { Button } from '@logdash/hyper-ui/presentational';

  type Props = {
    monitor: Monitor;
    clusterId: string;
    projectId: string;
    onEdit: () => void;
    onGetBadge: () => void;
  };

  const { monitor, clusterId, projectId, onEdit, onGetBadge }: Props = $props();

  let isDeleting = $state(false);

  async function onDeleteMonitor(): Promise<void> {
    if (!confirm('Are you sure you want to delete this monitor?')) {
      return;
    }

    isDeleting = true;

    try {
      await monitoringState.deleteMonitor(monitor.id);
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
  title="Monitor"
  description={monitor.url ? 'Its name, URL and badge.' : 'Its name and badge.'}
>
  <SettingsCardItem>
    {@render field('Name', monitor.name)}

    {#snippet action()}
      <Button variant="neutral" size="sm" onclick={onEdit}>Edit</Button>
    {/snippet}
  </SettingsCardItem>

  {#if monitor.url}
    <SettingsCardItem>
      {@render field('URL', monitor.url)}

      {#snippet action()}
        <Button variant="neutral" size="sm" onclick={onEdit}>Edit</Button>
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
      <Button variant="neutral" size="sm" onclick={onGetBadge}>
        <ShieldCheckIcon class="size-4" />
        Get badge
      </Button>
    {/snippet}
  </SettingsCardItem>
</SettingsCard>

<SettingsCard
  title="Danger zone"
  description="Actions that cannot be undone."
  variant="danger"
>
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

{#snippet field(label: string, value: string, muted = false)}
  <div class="flex min-w-0 items-center gap-3">
    <span class="text-neutral-500 w-16 shrink-0">{label}</span>
    <span class={['truncate', { 'text-neutral-500': muted }]}>{value}</span>
  </div>
{/snippet}
