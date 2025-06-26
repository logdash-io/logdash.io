<script lang="ts">
  import { ChevronDownIcon, TrendingUpIcon } from 'lucide-svelte';
  import StatusBadge from './StatusBadge.svelte';
  import UptimeChart from './UptimeChart.svelte';
  import PingChart from './PingChart.svelte';

  interface Monitor {
    name: string;
    pings: Array<{
      createdAt: string;
      statusCode: number;
      responseTimeMs: number;
    }>;
    buckets?: Array<{
      timestamp: string;
      successCount: number;
      failureCount: number;
      averageLatencyMs: number;
    } | null>;
  }

  interface Props {
    monitor: Monitor;
    status: 'up' | 'down' | 'degraded' | 'unknown';
    uptime: number;
    maxBucketsToShow?: number;
    maxPingsToShow?: number;
  }

  let {
    monitor,
    status,
    uptime,
    maxBucketsToShow = 90,
    maxPingsToShow = 90,
  }: Props = $props();

  const statusConfig = {
    up: {
      text: 'Operational',
      color: 'text-green-600',
    },
    down: {
      text: 'Down',
      color: 'text-red-600',
    },
    degraded: {
      text: 'Degraded',
      color: 'text-yellow-600',
    },
    unknown: {
      text: 'Unknown',
      color: 'text-gray-600',
    },
  };

  const config = $derived(statusConfig[status]);
  const statusText = $derived(config.text);
  const statusColor = $derived(config.color);
  let open = $state(false);
</script>

<div
  class="ld-card-base collapse w-fit min-w-full rounded-xl bg-white shadow-sm"
>
  <input bind:checked={open} class="p-0" type="checkbox" />
  <div class="collapse-title flex flex-col items-center p-6">
    <div class="flex w-full items-center justify-between">
      <div class="flex items-center gap-3">
        <StatusBadge {status} />

        <div>
          <h4 class="text-secondary text-lg font-medium">
            {monitor.name}
          </h4>
        </div>
      </div>

      <div class="flex items-center gap-2 text-right">
        <div class={`text-sm font-medium ${statusColor}`}>
          {statusText}
        </div>

        <ChevronDownIcon
          class={`h-5 w-5 text-gray-500 transition-transform duration-200 group-hover:rotate-180 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </div>
    </div>

    <div class="z-10 cursor-default sm:mt-2">
      <PingChart {maxPingsToShow} pings={monitor.pings} />
    </div>
  </div>

  <div class="collapse-content p-0 text-sm">
    <div class="px-6 sm:pb-2">
      <div class="flex flex-wrap gap-6 text-sm">
        <div class="mb-2 flex items-center gap-2">
          <TrendingUpIcon class="text-success h-4 w-4" />
          <span class="text-gray-600 dark:text-gray-300">
            90-day Uptime:
            <span class="font-mono font-medium text-gray-900 dark:text-white">
              {uptime.toFixed(2)}%
            </span>
          </span>
        </div>
      </div>

      <UptimeChart buckets={monitor.buckets || []} {maxBucketsToShow} />
    </div>
  </div>
</div>
