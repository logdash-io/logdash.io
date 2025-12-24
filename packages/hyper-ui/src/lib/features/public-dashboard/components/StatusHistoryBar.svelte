<script lang="ts">
  import Tooltip from "../../../presentational/Tooltip.svelte";
  import {
    groupPingsByStatus,
    formatDuration,
    formatTimeRange,
    type Ping,
    type StatusSegment,
  } from "../utils/group-pings-by-status";

  interface Props {
    class?: string;
    pings: Ping[];
    height?: number;
  }

  let { pings, height = 24, class: className }: Props = $props();

  const GAP_PX = 2;

  const segments = $derived(groupPingsByStatus(pings));

  const statusColors = {
    healthy: "bg-gradient-to-b from-green-600 via-green-600/80 to-green-600",
    unhealthy: "bg-gradient-to-b from-red-700 via-red-700/80 to-red-700",
  };

  function getTooltipContent(segment: StatusSegment): string {
    const status = segment.status === "healthy" ? "Healthy" : "Unhealthy";
    const timeRange = formatTimeRange(segment.startTime, segment.endTime);
    const avgResponse = formatDuration(segment.avgResponseTime);

    return `${status} • ${segment.pingCount} ping${segment.pingCount > 1 ? "s" : ""} • ${timeRange} • avg ${avgResponse}`;
  }
</script>

<div class={["w-full overflow-hidden", className]}>
  <div
    class="flex w-full items-end overflow-hidden"
    style="height: {height}px; gap: {GAP_PX}px;"
  >
    {#if segments.length === 0}
      <div
        class="w-full flex-shrink-0 rounded-sm dark:bg-base-100"
        style="height: {height}px;"
        title="No pings available"
      ></div>
    {:else}
      {#each segments as segment, index (index)}
        {@const colorClass = statusColors[segment.status]}
        <div
          class="min-w-0.5 flex-shrink"
          style="flex-grow: {segment.pingCount};"
        >
          <Tooltip content={getTooltipContent(segment)} placement="top">
            <div
              class={[
                "h-full w-full rounded-full transition-all duration-150 hover:opacity-80",
                colorClass,
              ]}
              style="height: {height}px;"
            ></div>
          </Tooltip>
        </div>
      {/each}
    {/if}
  </div>
</div>
