<script lang="ts">
  import { DateTime } from 'luxon';
  import Tooltip from '$lib/shared/ui/components/Tooltip.svelte';
  import StatusBar from './StatusBar.svelte';

  interface Ping {
    createdAt: string;
    statusCode: number;
    responseTimeMs: number;
  }

  interface Props {
    pings: Ping[];
    maxPingsToShow?: number;
  }

  let { pings, maxPingsToShow = 90 }: Props = $props();

  function formatDuration(ms: number): string {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }

  const pingsCount = $derived(pings?.length || 0);
  const displayPings = $derived(pings?.slice(0, maxPingsToShow) || []);
  const emptyPings = $derived(Math.max(0, maxPingsToShow - pingsCount));
</script>

<div class="hidden space-y-2 sm:block">
  <div
    class="flex h-6 w-fit flex-row-reverse items-end justify-end overflow-visible"
  >
    {#if pingsCount === 0}
      <div
        class="h-8 w-2 flex-shrink-0 rounded-sm bg-gray-200 dark:bg-gray-600"
        title="No pings available"
      ></div>
    {/if}

    <!-- Empty ping slots -->
    {#each Array.from({ length: emptyPings }) as _, i (i)}
      <StatusBar status={'unknown'} />
    {/each}

    <!-- Actual pings -->
    {#each displayPings as ping, pingIndex (pingIndex)}
      {@const isHealthy = ping.statusCode >= 200 && ping.statusCode < 400}
      {@const pingStatus = isHealthy ? 'healthy' : 'unhealthy'}
      <Tooltip
        content={`${DateTime.fromJSDate(new Date(ping.createdAt)).toFormat('HH:mm')} - ${ping.statusCode} (${formatDuration(ping.responseTimeMs)})`}
        placement="top"
      >
        <StatusBar status={pingStatus} />
      </Tooltip>
    {/each}
  </div>

  <div class="text-secondary/60 flex items-center justify-between text-xs">
    <span>Recent checks (last hour)</span>
    <span>
      Latest: {pingsCount > 0
        ? DateTime.fromJSDate(new Date(pings[0].createdAt)).toRelative()
        : 'No data'}
    </span>
  </div>
</div>
