<script lang="ts">
  import { UptimeChart } from '@logdash/hyper-ui/features';
  import UpgradeButton from '$lib/domains/shared/upgrade/UpgradeButton.svelte';
  import { MonitoringTimeRangeSelector } from '../../../presentational/monitoring/index.js';
  import type {
    PingBucket,
    PingBucketPeriod,
  } from '$lib/domains/app/projects/domain/monitoring/ping-bucket.js';

  type Props = {
    uptime: number;
    timeRange: PingBucketPeriod;
    pingBuckets: (PingBucket | null)[];
    isPaid: boolean;
    onTimeRangeChange: (range: PingBucketPeriod) => void;
  };

  const { uptime, timeRange, pingBuckets, isPaid, onTimeRangeChange }: Props =
    $props();

  const uptimeLabel = $derived(timeRange === '90h' ? '90-hour' : '90-day');
  const timeLabel = $derived(timeRange === '90h' ? 'hours ago' : 'days ago');
</script>

<div class="w-full p-0 text-sm">
  <div class="relative w-full px-6 pb-6">
    {#if !isPaid}
      <div class="absolute inset-0 z-10 -mt-6 flex items-center justify-center">
        <div
          class="text-primary flex h-full w-full items-center justify-center bg-gradient-to-b from-transparent via-base-200/60 to-transparent backdrop-blur-[2px] px-4 py-2"
        >
          <div class="w-fit">
            <UpgradeButton source="monitor-historical-uptime">
              Enable historical uptime
            </UpgradeButton>
          </div>
        </div>
      </div>
    {/if}

    <div class="mb-2 flex flex-wrap items-center justify-between gap-6 text-sm">
      <div class="flex items-center gap-2">
        <span class="text-base-content/80">
          {uptimeLabel} Uptime:
          <span class="font-mono font-medium text-base-content">
            {uptime?.toFixed(2)}%
          </span>
        </span>
      </div>

      <MonitoringTimeRangeSelector
        currentRange={timeRange}
        canSwitchTabs={isPaid}
        onRangeChange={onTimeRangeChange}
      />
    </div>

    <UptimeChart buckets={pingBuckets} maxBucketsToShow={90} {timeLabel} />
  </div>
</div>
