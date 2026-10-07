<script lang="ts">
  import { resolve } from '$app/paths';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import { getStatusFromMonitor } from '$lib/domains/app/clusters/application/get-status-from-monitor.js';
  import { ServiceHealthState } from '$lib/domains/app/clusters/application/service-health.state.svelte.js';
  import {
    SERVICE_STATUS_DOT,
    SERVICE_STATUS_LABEL,
    SERVICE_STATUS_TEXT,
  } from '$lib/domains/app/clusters/domain/service-status.js';
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import { Tooltip } from '@logdash/hyper-ui/presentational';
  import { untrack } from 'svelte';

  type Props = { clusterId: string };

  const { clusterId }: Props = $props();

  const POLL_INTERVAL_MS = 60_000;
  const CHIP =
    'hover:bg-surface-50-hover-bg focus-visible:outline-brand flex h-8 shrink-0 items-center gap-2 rounded-full edge px-3 text-sm whitespace-nowrap focus-visible:outline-2';
  const LABEL =
    'hover:text-fg-default transition-ink focus-visible:outline-brand mr-1 rounded-md text-[13px] text-fg-muted focus-visible:outline-2';

  const health = new ServiceHealthState();

  const monitors = $derived(monitoringState.monitorsOf(clusterId));
  const services = $derived(clustersState.get(clusterId)?.projects ?? []);
  const targetKey = $derived(
    [
      ...monitors.map(({ id }) => id),
      '|',
      ...services.map(({ id }) => id),
    ].join(','),
  );

  $effect(() => {
    void targetKey;
    const targets = untrack(() => ({
      monitorIds: monitors.map(({ id }) => id),
      projectIds: services.map(({ id }) => id),
    }));

    void health.load(targets);
    const timer = setInterval(() => {
      if (!document.hidden) {
        void health.load(targets);
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(timer);
  });

  function errorsLabel(count: number): string {
    return `${count} ${count === 1 ? 'error' : 'errors'}`;
  }
</script>

{#if monitors.length || services.length}
  <nav
    class="flex flex-wrap items-center gap-2 edge-b px-4 py-2"
    aria-label="Domain health"
  >
    {#if monitors.length}
      <a
        href={resolve('/app/domains/[cluster_id]/uptime', {
          cluster_id: clusterId,
        })}
        class={LABEL}
      >
        Uptime
      </a>
      {#each monitors as monitor (monitor.id)}
        {@const status = getStatusFromMonitor(monitor)}
        {@const uptime = health.uptime[monitor.id] ?? null}
        <Tooltip content="Uptime over the last 24 hours" placement="bottom">
          <a
            href={resolve('/app/domains/[cluster_id]/uptime/[monitor_id]', {
              cluster_id: clusterId,
              monitor_id: monitor.id,
            })}
            class={CHIP}
          >
            <span
              class={[
                'size-1.5 shrink-0 rounded-full',
                SERVICE_STATUS_DOT[status],
              ]}
            ></span>
            <span class="font-medium">{monitor.name}</span>
            {#if status !== 'up'}
              <span class={SERVICE_STATUS_TEXT[status]}>
                {SERVICE_STATUS_LABEL[status]}
              </span>
            {/if}
            {#if uptime !== null}
              <span class="text-fg-faint" aria-hidden="true">·</span>
              <span class="text-fg-tertiary tabular-nums">
                {Number(uptime.toFixed(2))}%
              </span>
            {/if}
          </a>
        </Tooltip>
      {/each}
    {/if}

    {#if services.length}
      {#if monitors.length}
        <span
          class="bg-surface-50-border mx-1 h-4 w-px"
          aria-hidden="true"
        ></span>
      {/if}
      <a
        href={resolve('/app/domains/[cluster_id]/services', {
          cluster_id: clusterId,
        })}
        class={LABEL}
      >
        Services
      </a>
      {#each services as service (service.id)}
        {@const errors = health.errors[service.id] ?? 0}
        <a
          href={resolve('/app/domains/[cluster_id]/[project_id]', {
            cluster_id: clusterId,
            project_id: service.id,
          })}
          class={CHIP}
        >
          <span class="font-medium">{service.name}</span>
          {#if errors}
            <span class="text-fg-faint" aria-hidden="true">·</span>
            <span class="text-error tabular-nums">{errorsLabel(errors)}</span>
          {/if}
        </a>
      {/each}
    {/if}
  </nav>
{/if}
