<script lang="ts">
  import { UptimeChart } from '@logdash/hyper-ui/features';
  import { MonitoringTimeRangeSelector } from '../../../presentational/monitoring/index.js';
  import type {
    PingBucket,
    PingBucketPeriod,
  } from '$lib/domains/app/projects/domain/monitoring/ping-bucket.js';

  type Props = {
    uptime: number | null;
    timeRange: PingBucketPeriod;
    pingBuckets: (PingBucket | null)[];
    onTimeRangeChange: (range: PingBucketPeriod) => void;
  };

  const { uptime, timeRange, pingBuckets, onTimeRangeChange }: Props = $props();

  const uptimeLabel = $derived(timeRange === '90h' ? '90-hour' : '90-day');
  const timeLabel = $derived(timeRange === '90h' ? 'hours ago' : 'days ago');
</script>

<div class="w-full p-0 text-sm">
  <div class="w-full px-6 pb-6">
    <div class="mb-2 flex flex-wrap items-center justify-between gap-6 text-sm">
      <div class="flex items-center gap-2">
        <span class="text-neutral-300">
          {uptimeLabel} Uptime:
          <span class="font-mono font-medium text-fg-default">
            {uptime === null ? '--' : `${uptime.toFixed(2)}%`}
          </span>
        </span>
      </div>

      <MonitoringTimeRangeSelector
        currentRange={timeRange}
        onRangeChange={onTimeRangeChange}
      />
    </div>

    <UptimeChart buckets={pingBuckets} maxBucketsToShow={90} {timeLabel} />
  </div>
</div>
