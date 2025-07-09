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
    class?: string;
    buckets: (Bucket | null)[];
    maxBucketsToShow?: number;
    adaptToWidth?: boolean;
    timeLabel?: string;
  }

  let {
    buckets,
    maxBucketsToShow,
    adaptToWidth = false,
    timeLabel = 'days ago',
    class: className,
  }: Props = $props();

  let containerWidth = $state(0);
  const BAR_WIDTH = 8;

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
    if (uptime >= 99.99) return 'up';
    if (uptime >= 50) return 'degraded';
    return 'down';
  }

  const availableSlots = $derived(
    adaptToWidth ? Math.floor(containerWidth / BAR_WIDTH) : maxBucketsToShow,
  );

  const bucketsCount = $derived(buckets?.length || 0);
  const displayBuckets = $derived(buckets?.slice(0, availableSlots) || []);
  const emptyBuckets = $derived(Math.max(0, availableSlots - bucketsCount));
</script>

<div
  class={[
    'w-full space-y-2',
    className,
    {
      'overflow-hidden': adaptToWidth,
    },
  ]}
  bind:clientWidth={containerWidth}
>
  <div
    class={[
      'flex h-6 w-full flex-row-reverse items-end justify-start',
      {
        'overflow-visible': !adaptToWidth,
      },
    ]}
  >
    {#each displayBuckets as bucket, bucketIndex (bucketIndex)}
      {@const bucketStatus = getBucketStatus(bucket)}
      {@const uptime = getUptimeFromBucket(bucket)}
      <Tooltip
        content={bucket
          ? `${DateTime.fromJSDate(new Date(bucket.timestamp)).toFormat('MMM dd, HH:mm')} - ${uptime.toFixed(1)}% uptime`
          : 'No data available for this day'}
        placement="top"
      >
        <StatusBar status={bucketStatus} />
      </Tooltip>
    {/each}

    {#each Array.from({ length: emptyBuckets }) as _, i (i)}
      <Tooltip content="No data available" placement="top">
        <StatusBar status={'unknown'} />
      </Tooltip>
    {/each}
  </div>

  <div
    class="text-secondary/60 flex items-center justify-between font-mono text-xs"
  >
    <span>
      {availableSlots}
      {timeLabel}
    </span>
    <span>Now</span>
  </div>
</div>
