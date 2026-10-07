<script lang="ts">
  import {
    fillEmptySlots,
    type PingBucket,
    type PingBucketPeriod,
  } from '$lib/domains/app/projects/domain/monitoring/ping-bucket.js';
  import Well from '$lib/domains/shared/ui/components/Well.svelte';
  import { UptimeBars } from '@logdash/hyper-ui/features';

  type Props = {
    label: string;
    timeRange: PingBucketPeriod;
    pingBuckets: (PingBucket | null)[];
  };

  const { label, timeRange, pingBuckets }: Props = $props();

  const unit = $derived(timeRange === '90d' ? 'day' : 'hour');
</script>

<Well label="Uptime history" title="Uptime history">
  <div class="px-3 pb-2">
    <UptimeBars
      buckets={fillEmptySlots(pingBuckets, unit)}
      {label}
      {unit}
      raised
    />
  </div>
</Well>
