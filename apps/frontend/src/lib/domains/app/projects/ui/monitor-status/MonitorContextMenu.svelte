<script lang="ts">
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import { Tooltip } from '@logdash/hyper-ui/presentational';
  import { PenLineIcon, SettingsIcon, Trash2Icon } from 'lucide-svelte';

  type Props = {
    monitorId: string;
  };

  const { monitorId }: Props = $props();
  const monitor = $derived(monitoringState.getMonitorById(monitorId));
</script>

{#snippet menu(close: () => void)}
  <ul
    tabindex="0"
    class="menu dropdown-content ld-card-base rounded-box z-1 p-2 shadow"
  >
    <li>
      <a
        onclick={async (e) => {
          e.stopPropagation();
          const newName = prompt('Enter new monitor name', monitor?.name);
          const hasCancelled = newName === null;
          close();

          if (hasCancelled) {
            return;
          }

          if (!newName || newName.trim() === '') {
            toast.warning('Monitor name cannot be empty', 5000);
            return;
          }

          if (newName === monitor?.name) {
            toast.info('Monitor name is the same, no changes made', 5000);
            return;
          }

          try {
            await monitoringState.updateMonitorName(monitorId, newName);
            toast.success('Monitor name updated successfully', 5000);
          } catch (error) {
            toast.error('Failed to update monitor name', 5000);
          }
        }}
        class="whitespace-nowrap"
      >
        Rename monitor

        <PenLineIcon class="ml-auto h-4 w-4" />
      </a>
    </li>

    <li>
      <a
        onclick={async () => {
          if (!confirm('Are you sure you want to delete this monitor?')) {
            close();
            return;
          }

          try {
            const onDeleted = toast.info('Deleting monitor...', 60000);
            await monitoringState.deleteMonitor(monitorId);
            onDeleted();
            toast.success('Monitor deleted successfully', 5000);
            close();
          } catch (error) {
            toast.error('Failed to delete monitor', 5000);
            close();
          }
        }}
        class="text-error whitespace-nowrap"
      >
        Delete monitor

        <Trash2Icon class="ml-auto h-4 w-4" />
      </a>
    </li>
  </ul>
{/snippet}

<Tooltip content={menu} interactive={true} placement="bottom">
  <button
    class="btn btn-circle ld-card-base gap-1"
    data-posthog-id="monitor-settings-button"
    onclick={(e) => {
      e.stopPropagation();
    }}
  >
    <SettingsIcon class="h-5 w-5" />
  </button>
</Tooltip>
