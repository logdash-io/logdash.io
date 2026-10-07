<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import DomainSetupCard from '$lib/domains/app/clusters/ui/DomainSetup/DomainSetupCard.svelte';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import { getStatusFromMonitor } from '$lib/domains/app/clusters/application/get-status-from-monitor.js';
  import { topBarState } from '$lib/domains/app/clusters/application/top-bar.state.svelte.js';
  import { listServices } from '$lib/domains/app/clusters/domain/service-groups.js';
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import { formatUptime } from '@logdash/hyper-ui/features/public-dashboard/utils/format-status-page';
  import Well from '$lib/domains/shared/ui/components/Well.svelte';
  import { untrack } from 'svelte';
  import AddMonitorForm from './AddMonitorForm.svelte';
  import MonitorRow from './MonitorRow.svelte';
  import UptimeToolbar from './UptimeToolbar.svelte';

  type Props = { clusterId: string };

  const { clusterId }: Props = $props();

  const PINGS_PER_MONITOR = 30;

  const monitors = $derived(monitoringState.monitorsOf(clusterId));
  const groups = $derived(
    listServices(
      monitors.map(({ id, name, url }) => ({ id, name, url })),
      clustersState.get(clusterId)?.name,
    ),
  );
  const monitorIds = $derived(monitors.map((monitor) => monitor.id).join(','));
  const statuses = $derived(monitors.map(getStatusFromMonitor));
  const latencies = $derived(
    monitors.flatMap((monitor) => {
      const last = monitoringState.monitoringPings(monitor.id).at(-1);
      return last && last.statusCode ? [last.responseTimeMs] : [];
    }),
  );
  const uptimes = $derived(
    monitors.flatMap((monitor) => {
      const uptime = monitoringState.calculateUptime(monitor.id);
      return uptime === null ? [] : [uptime];
    }),
  );
  const stats = $derived([
    { label: 'Monitors', value: String(monitors.length) },
    {
      label: 'Down',
      value: String(statuses.filter((status) => status === 'down').length),
      tone: statuses.includes('down') ? 'text-error' : undefined,
    },
    {
      label: 'Avg response',
      value: latencies.length ? `${Math.round(average(latencies))} ms` : '–',
    },
    {
      label:
        monitoringState.timeRange === '90h'
          ? '90-hour uptime'
          : '90-day uptime',
      value: uptimes.length ? formatUptime(average(uptimes)) : '–',
    },
  ]);

  $effect(() => topBarState.show(toolbar));

  $effect(() => {
    const id = clusterId;
    void untrack(() => monitoringState.sync(id));

    return () => monitoringState.unsync();
  });

  $effect(() => {
    void monitorIds;
    untrack(() => {
      for (const monitor of monitors) {
        void monitoringState.loadMonitorPings(
          clusterId,
          monitor.id,
          PINGS_PER_MONITOR,
        );
      }
    });
  });

  function average(values: number[]): number {
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  function onCreated(monitorId: string): void {
    void goto(
      resolve('/app/domains/[cluster_id]/uptime/[monitor_id]', {
        cluster_id: clusterId,
        monitor_id: monitorId,
      }),
    );
  }
</script>

<div class="@container grid w-full grid-cols-1">
  <div
    class={[
      'col-start-1 row-start-1 flex flex-col gap-2 p-2',
      {
        'max-h-160 overflow-hidden blur-[2px] select-none [mask-image:linear-gradient(to_bottom,black,transparent)]':
          monitors.length === 0,
      },
    ]}
    inert={monitors.length === 0}
  >
    {#if page.data.setupOpen && monitors.length > 0}
      <DomainSetupCard {clusterId} />
    {/if}

    <section
      aria-label="Uptime overview"
      class="bg-surface-25-bg rounded-2xl p-2"
    >
      <dl class="grid grid-cols-2 gap-2 @2xl:grid-cols-4">
        {#each stats as stat (stat.label)}
          <div class="flex min-w-0 flex-col gap-1.5 rounded-lg p-3">
            <dt class="text-fg-muted text-xs">{stat.label}</dt>
            <dd class={['font-mono text-2xl tabular-nums', stat.tone]}>
              {stat.value}
            </dd>
          </div>
        {/each}
      </dl>
    </section>

    <Well label="Monitors" title="Monitors">
      {#if groups.services.length}
        <ul class="flex flex-col gap-0.5">
          {#each groups.services as item (item.id)}
            {@const monitor = monitoringState.getMonitorById(item.id)}
            {#if monitor}
              <MonitorRow {clusterId} {monitor} {item} />
            {/if}
          {/each}
        </ul>
      {:else}
        <p class="text-fg-muted px-3 pb-2 text-sm">
          Add the addresses your users open, like your website or your API.
        </p>
      {/if}
    </Well>

    {#if groups.dependencies.length}
      <Well label="Dependencies" title="Dependencies">
        <ul class="flex flex-col gap-0.5">
          {#each groups.dependencies as item (item.id)}
            {@const monitor = monitoringState.getMonitorById(item.id)}
            {#if monitor}
              <MonitorRow {clusterId} {monitor} {item} />
            {/if}
          {/each}
        </ul>
      </Well>
    {/if}
  </div>

  {#if monitors.length === 0}
    <section
      class="relative z-10 col-start-1 row-start-1 mx-auto w-full max-w-168 self-start px-2 pt-32 pb-10 @xl:px-8"
      aria-labelledby="add-first-monitor"
    >
      <div
        class="bg-surface-elevated-bg edge flex min-w-0 flex-col gap-4 rounded-xl p-5 shadow-2xl"
      >
        <div class="flex flex-col gap-1">
          <h2 id="add-first-monitor" class="text-[15px] font-medium">
            Watch your first address
          </h2>
          <p class="text-fg-muted text-[13px]">
            We check it around the clock and alert you the moment it goes down.
          </p>
        </div>
        <AddMonitorForm {clusterId} oncreated={onCreated} />
      </div>
    </section>
  {/if}
</div>

{#snippet toolbar()}
  <UptimeToolbar {clusterId} add={monitors.length > 0} />
{/snippet}
