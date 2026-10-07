<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import AddMonitorForm from './AddMonitorForm.svelte';

  type Props = { clusterId: string };

  const { clusterId }: Props = $props();

  function onCreated(monitorId: string): void {
    void goto(
      resolve('/app/domains/[cluster_id]/uptime/[monitor_id]', {
        cluster_id: clusterId,
        monitor_id: monitorId,
      }),
    );
  }
</script>

<div class="mx-auto flex w-full max-w-168 flex-col p-2">
  <section
    class="bg-surface-25-bg flex flex-col gap-4 rounded-2xl p-5"
    aria-labelledby="new-monitor-title"
  >
    <div class="flex flex-col gap-1">
      <h1 id="new-monitor-title" class="text-[15px] font-medium">
        Add a monitor
      </h1>
      <p class="text-fg-muted text-[13px]">
        Watch a URL your users open, or a job that should check in on time.
        Every alert channel of this domain hears about it.
      </p>
    </div>
    <AddMonitorForm {clusterId} oncreated={onCreated} />
  </section>
</div>
