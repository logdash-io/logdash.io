<script lang="ts">
  import {
    fillEmptySlots,
    type PingBucket,
    type PingBucketPeriod,
  } from '$lib/domains/app/projects/domain/monitoring/ping-bucket.js';
  import PaneHeader from '$lib/domains/shared/ui/components/PaneHeader.svelte';
  import TimeRangeSelector from '$lib/domains/shared/ui/components/TimeRangeSelector.svelte';
  import { UptimeBars } from '@logdash/hyper-ui/features';

  type Props = {
    label: string;
    timeRange: PingBucketPeriod;
    pingBuckets: (PingBucket | null)[];
    onTimeRangeChange: (range: PingBucketPeriod) => void;
  };

  const { label, timeRange, pingBuckets, onTimeRangeChange }: Props = $props();

  const RANGES: { value: PingBucketPeriod; label: string }[] = [
    { value: '90h', label: '90h' },
    { value: '90d', label: '90d' },
  ];

  const unit = $derived(timeRange === '90d' ? 'day' : 'hour');
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
    <UptimeBars
      buckets={fillEmptySlots(pingBuckets, unit)}
      {label}
      {unit}
      raised
    />
  </div>
</section>
