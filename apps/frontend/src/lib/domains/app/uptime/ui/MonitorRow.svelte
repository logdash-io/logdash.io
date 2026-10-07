<script lang="ts">
  import { resolve } from '$app/paths';
  import { getStatusFromMonitor } from '$lib/domains/app/clusters/application/get-status-from-monitor.js';
  import type { ServiceItem } from '$lib/domains/app/clusters/domain/service-groups.js';
  import {
    SERVICE_STATUS_DOT,
    SERVICE_STATUS_LABEL,
    SERVICE_STATUS_TEXT,
  } from '$lib/domains/app/clusters/domain/service-status.js';
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import type { Monitor } from '$lib/domains/app/projects/domain/monitoring/monitor.js';
  import type { PingBucket } from '$lib/domains/app/projects/domain/monitoring/ping-bucket.js';
  import { formatUptime } from '@logdash/hyper-ui/features/public-dashboard/utils/format-status-page';

  type Props = {
    clusterId: string;
    monitor: Monitor;
    item: ServiceItem;
  };

  const { clusterId, monitor, item }: Props = $props();

  const BARS = 30;

  const status = $derived(getStatusFromMonitor(monitor));
  const lastPing = $derived(monitoringState.monitoringPings(monitor.id).at(-1));
  const uptime = $derived(monitoringState.calculateUptime(monitor.id));
  const bars = $derived(
    monitoringState.getPingBuckets(monitor.id).slice(-BARS),
  );

  function barClass(bucket: PingBucket | null): string {
    if (!bucket || bucket.successCount + bucket.failureCount === 0) {
      return 'bg-surface-150-bg';
    }

    if (bucket.failureCount === 0) {
      return 'bg-surface-200-bg';
    }

    return bucket.successCount === 0 ? 'bg-error' : 'bg-warning';
  }
</script>

<li>
  <a
    href={resolve('/app/domains/[cluster_id]/uptime/[monitor_id]', {
      cluster_id: clusterId,
      monitor_id: monitor.id,
    })}
    class="hover:bg-surface-25-hover-bg focus-visible:outline-brand flex h-12 items-center gap-3 rounded-lg px-3 text-sm focus-visible:outline-2"
  >
    <span
      class={['size-1.5 shrink-0 rounded-full', SERVICE_STATUS_DOT[status]]}
    ></span>
    <span class="flex min-w-0 flex-1 items-baseline gap-2">
      <span class="truncate font-medium">{item.label}</span>
      {#if item.urlLabel}
        <span class="text-fg-muted hidden truncate text-xs @md:inline">
          {item.urlLabel}
        </span>
      {/if}
    </span>

    {#if bars.length}
      <span
        class="hidden h-5 shrink-0 items-stretch gap-0.5 @3xl:flex"
        aria-hidden="true"
      >
        {#each bars as bucket, index (index)}
          <span class={['w-1 rounded-[1px]', barClass(bucket)]}></span>
        {/each}
      </span>
    {/if}

    <span
      class="text-fg-tertiary hidden w-16 shrink-0 text-right tabular-nums @lg:block"
    >
      {lastPing?.statusCode ? `${lastPing.responseTimeMs} ms` : '–'}
    </span>
    <span class="w-16 shrink-0 text-right tabular-nums">
      {uptime === null ? '–' : formatUptime(uptime)}
    </span>
    <span
      class={[
        'hidden w-14 shrink-0 text-right @sm:block',
        SERVICE_STATUS_TEXT[status],
      ]}
    >
      {SERVICE_STATUS_LABEL[status]}
    </span>
  </a>
</li>
