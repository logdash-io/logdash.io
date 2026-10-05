<script lang="ts">
  import { resolve } from '$app/paths';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import { getStatusFromMonitor } from '$lib/domains/app/clusters/application/get-status-from-monitor.js';
  import { serviceEntries } from '$lib/domains/app/clusters/application/service-entries.js';
  import {
    ServiceHealthState,
    type ServiceHealthTarget,
  } from '$lib/domains/app/clusters/application/service-health.state.svelte.js';
  import { listServices } from '$lib/domains/app/clusters/domain/service-groups.js';
  import {
    SERVICE_STATUS_DOT,
    SERVICE_STATUS_LABEL,
    SERVICE_STATUS_TEXT,
    type ServiceStatus,
  } from '$lib/domains/app/clusters/domain/service-status.js';
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import { Tooltip } from '@logdash/hyper-ui/presentational';
  import { untrack } from 'svelte';

  type Props = { clusterId: string };

  type HealthRow = {
    id: string;
    label: string;
    monitorId?: string;
    status: ServiceStatus | null;
  };

  const { clusterId }: Props = $props();

  const POLL_INTERVAL_MS = 60_000;

  const health = new ServiceHealthState();

  const rows = $derived.by((): HealthRow[] => {
    const { services, dependencies } = listServices(
      serviceEntries(clustersState.get(clusterId)),
    );

    return [...services, ...dependencies].map((item) => {
      const monitor = monitoringState.getMonitorByProjectId(item.id);

      return {
        id: item.id,
        label: item.label || 'New service',
        monitorId: monitor?.id,
        status: monitor ? getStatusFromMonitor(monitor) : null,
      };
    });
  });
  const targetKey = $derived(
    rows.map(({ id, monitorId }) => `${id}:${monitorId ?? ''}`).join(','),
  );

  $effect(() => {
    void targetKey;
    const targets = untrack((): ServiceHealthTarget[] =>
      rows.map(({ id, monitorId }) => ({ projectId: id, monitorId })),
    );

    void health.load(targets);
    const timer = setInterval(() => {
      if (!document.hidden) {
        void health.load(targets);
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(timer);
  });

  function uptimeLabel(uptime: number): string {
    return `${Number(uptime.toFixed(2))}% uptime`;
  }

  function errorsLabel(count: number): string {
    return `${count} ${count === 1 ? 'error' : 'errors'}`;
  }
</script>

{#if rows.length}
  <nav
    class="flex flex-wrap items-center gap-2 edge-b px-4 py-2"
    aria-label="Services"
  >
    <a
      href={resolve('/app/domains/[cluster_id]/services', {
        cluster_id: clusterId,
      })}
      class="hover:text-fg-default transition-ink focus-visible:outline-brand mr-1 rounded-md text-[13px] text-fg-muted focus-visible:outline-2"
    >
      Services
    </a>
    {#each rows as row (row.id)}
      {@const uptime = health.uptime[row.id] ?? null}
      {@const errors = health.errors[row.id] ?? 0}
      {#if uptime !== null || errors}
        <Tooltip
          content="Uptime and errors over the last 24 hours"
          placement="bottom"
        >
          {@render chip(row, uptime, errors)}
        </Tooltip>
      {:else}
        {@render chip(row, uptime, errors)}
      {/if}
    {/each}
  </nav>
{/if}

{#snippet chip(row: HealthRow, uptime: number | null, errors: number)}
  <a
    href={resolve('/app/domains/[cluster_id]/[project_id]', {
      cluster_id: clusterId,
      project_id: row.id,
    })}
    class="hover:bg-surface-50-hover-bg focus-visible:outline-brand flex h-8 shrink-0 items-center gap-2 rounded-full edge px-3 text-sm whitespace-nowrap focus-visible:outline-2"
  >
    <span
      class={[
        'size-1.5 shrink-0 rounded-full',
        SERVICE_STATUS_DOT[row.status ?? 'unknown'],
      ]}
    ></span>
    <span class="font-medium">{row.label}</span>
    {#if row.status}
      <span class={SERVICE_STATUS_TEXT[row.status]}>
        {SERVICE_STATUS_LABEL[row.status]}
      </span>
    {/if}
    {#if uptime !== null}
      <span class="text-fg-faint" aria-hidden="true">·</span>
      <span class="text-fg-tertiary tabular-nums">{uptimeLabel(uptime)}</span>
    {/if}
    {#if errors}
      <span class="text-fg-faint" aria-hidden="true">·</span>
      <span class="text-error tabular-nums">{errorsLabel(errors)}</span>
    {/if}
  </a>
{/snippet}
