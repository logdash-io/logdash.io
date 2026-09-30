<script lang="ts">
  import type {
    PingBucket,
    PingBucketPeriod,
  } from '$lib/domains/app/projects/domain/monitoring/ping-bucket.js';
  import PaneHeader from '$lib/domains/shared/ui/components/PaneHeader.svelte';
  import TimeRangeSelector from '$lib/domains/shared/ui/components/TimeRangeSelector.svelte';
  import { UptimeChart } from '@logdash/hyper-ui/features';

  type Props = {
    timeRange: PingBucketPeriod;
    pingBuckets: (PingBucket | null)[];
    onTimeRangeChange: (range: PingBucketPeriod) => void;
  };

  const { timeRange, pingBuckets, onTimeRangeChange }: Props = $props();

  const RANGES: { value: PingBucketPeriod; label: string }[] = [
    { value: '90h', label: '90h' },
    { value: '90d', label: '90d' },
  ];
  const BUCKETS = 90;

  const timeLabel = $derived(timeRange === '90h' ? 'hours ago' : 'days ago');
</script>

<section class="border-hairline border-b">
  <PaneHeader title="Uptime history">
    <TimeRangeSelector
      label="Uptime range"
      options={RANGES}
      selected={timeRange}
      onSelect={onTimeRangeChange}
    />
  </PaneHeader>

  <div class="p-4">
    <UptimeChart
      class="*:last:text-neutral-500"
      buckets={pingBuckets}
      maxBucketsToShow={BUCKETS}
      {timeLabel}
    />
  </div>
</section>
