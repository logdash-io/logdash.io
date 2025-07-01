<script lang="ts">
  import { DateTime } from 'luxon';
  import Tooltip from '$lib/domains/shared/ui/components/Tooltip.svelte';
  import StatusBar from '$lib/domains/app/projects/ui/presentational/public-dashboard/StatusBar.svelte';

  interface Bucket {
    timestamp: string;
    successCount: number;
    failureCount: number;
    averageLatencyMs: number;
  }

  interface Props {
    buckets: (Bucket | null)[];
    maxBucketsToShow?: number;
  }

  let { buckets, maxBucketsToShow = 90 }: Props = $props();

  function getUptimeFromBucket(bucket: Bucket | null | undefined): number {
    if (!bucket) return 100; // No data = assume up
    const total = bucket.successCount + bucket.failureCount;
    if (total === 0) return 100;
    return (bucket.successCount / total) * 100;
  }

  function getBucketStatus(
    bucket: Bucket | null | undefined,
  ): 'up' | 'degraded' | 'down' | 'unknown' {
    if (!bucket) return 'unknown';
    const uptime = getUptimeFromBucket(bucket);
    if (uptime >= 95) return 'up';
    if (uptime >= 50) return 'degraded';
    return 'down';
  }

  const bucketsCount = $derived(buckets?.length || 0);
  const displayBuckets = $derived(buckets?.slice(0, maxBucketsToShow) || []);
  const emptyBuckets = $derived(Math.max(0, maxBucketsToShow - bucketsCount));
</script>

<div class="hidden space-y-2 sm:block">
  <div
    class="flex h-6 w-fit flex-row-reverse items-end justify-end overflow-visible"
  >
    {#each Array.from({ length: emptyBuckets }) as _, i (i)}
      <div
        class="h-8 w-2 flex-shrink-0 rounded-sm bg-gradient-to-b from-neutral-700 via-neutral-700/80 to-neutral-700"
        title="No data"
      ></div>
    {/each}

    {#each displayBuckets as bucket, bucketIndex (bucketIndex)}
      {@const bucketStatus = getBucketStatus(bucket)}
      {@const uptime = getUptimeFromBucket(bucket)}
      <Tooltip
        content={bucket
          ? `${DateTime.fromJSDate(new Date(bucket.timestamp)).toFormat('MMM dd, yyyy')} - ${uptime.toFixed(1)}% uptime`
          : 'No data available for this day'}
        placement="top"
      >
        <StatusBar status={bucketStatus} />
      </Tooltip>
    {/each}
  </div>

  <div class="text-secondary/60 flex items-center justify-between text-xs">
    <span>
      {maxBucketsToShow} days ago
    </span>
    <span>Today</span>
  </div>
</div>
