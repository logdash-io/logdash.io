<script lang="ts">
  import Tooltip from "../../../presentational/Tooltip.svelte";
  import {
    groupBucketsByStatus,
    formatBucketTimeRange,
    type Bucket,
    type BucketSegment,
  } from "../utils/group-buckets-by-status";

  interface Props {
    class?: string;
    buckets: (Bucket | null)[];
    maxBucketsToShow?: number;
    adaptToWidth?: boolean;
    timeLabel?: string;
    height?: number;
  }

  let {
    buckets,
    maxBucketsToShow = 90,
    adaptToWidth = false,
    timeLabel = "days ago",
    height = 6,
    class: className,
  }: Props = $props();

  const GAP_PX = 2;

  const displayBuckets = $derived(buckets?.slice(-maxBucketsToShow) || []);
  const segments = $derived(groupBucketsByStatus(displayBuckets));
  const bucketsCount = $derived(displayBuckets.length);

  const statusColors = {
    up: "bg-gradient-to-b from-green-600 via-green-600/80 to-green-600",
    degraded:
      "bg-gradient-to-b from-yellow-600 via-yellow-600/80 to-yellow-600",
    down: "bg-gradient-to-b from-red-700 via-red-700/80 to-red-700",
    unknown: "bg-base-100",
  };

  function getTooltipContent(segment: BucketSegment): string {
    const statusLabels = {
      up: "Healthy",
      degraded: "Degraded",
      down: "Down",
      unknown: "No data",
    };
    const status = statusLabels[segment.status];
    const timeRange = formatBucketTimeRange(segment.startTime, segment.endTime);
    const uptime = segment.avgUptime.toFixed(1);

    return `${status} • ${segment.bucketCount} ${segment.bucketCount > 1 ? "periods" : "period"} • ${timeRange} • ${uptime}% uptime`;
  }
</script>

<div class={["w-full space-y-2 overflow-hidden", className]}>
  <div
    class="flex w-full items-end overflow-hidden"
    style="height: {height}px; gap: {GAP_PX}px;"
  >
    {#if segments.length === 0}
      <div
        class="w-full flex-shrink-0 rounded-full dark:bg-base-100"
        style="height: {height}px;"
        title="No data available"
      ></div>
    {:else}
      {#each segments as segment, index (index)}
        {@const colorClass = statusColors[segment.status]}
        <div
          class="min-w-0.5 flex-shrink"
          style="flex-grow: {segment.bucketCount};"
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

  <div
    class="text-secondary/60 flex items-center justify-between font-mono text-xs"
  >
    <span>
      {bucketsCount}
      {timeLabel}
    </span>
    <span>Now</span>
  </div>
</div>
