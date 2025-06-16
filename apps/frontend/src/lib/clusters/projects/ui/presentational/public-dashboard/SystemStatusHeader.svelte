<script lang="ts">
  import { DateTime } from 'luxon';
  import {
    CheckCircleIcon,
    AlertTriangleIcon,
    XCircleIcon,
    ClockIcon,
  } from 'lucide-svelte';
  import { onMount } from 'svelte';

  type SystemStatus = 'operational' | 'degraded' | 'outage' | 'unknown';

  interface Props {
    systemStatus: SystemStatus;
    lastUpdated: Date;
    monitorCount: number;
  }

  let { systemStatus, lastUpdated, monitorCount }: Props = $props();

  const statusConfig = {
    operational: {
      text: 'All Systems Operational',
      color: 'text-green-600',
      bgColor:
        'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10',
      borderColor: 'border-green-200 dark:border-success/10',
      icon: CheckCircleIcon,
    },
    degraded: {
      text: 'Partial System Outage',
      color: 'text-yellow-600',
      bgColor:
        'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-900/10',
      borderColor: 'border-yellow-200 dark:border-yellow-800/10',
      icon: AlertTriangleIcon,
    },
    outage: {
      text: 'Major System Outage',
      color: 'text-red-600',
      bgColor:
        'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/10',
      borderColor: 'border-red-200 dark:border-red-800/10',
      icon: XCircleIcon,
    },
    unknown: {
      text: 'Status Unknown',
      color: 'text-gray-600',
      bgColor:
        'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-900/10',
      borderColor: 'border-gray-200 dark:border-gray-800/10',
      icon: ClockIcon,
    },
  };

  const config = $derived(statusConfig[systemStatus]);
  let now = $state(new Date());

  onMount(() => {
    const interval = setInterval(() => {
      now = new Date();
    }, 1000);

    return () => clearInterval(interval);
  });

  const userFriendlyLastUpdated = $derived.by(() => {
    const diffInSeconds = Math.floor(
      (now.getTime() - lastUpdated.getTime()) / 1000,
    );

    if (diffInSeconds < 10) {
      return 'Updated just now';
    }

    if (diffInSeconds < 60) {
      return `Updated less than a minute ago`;
    }

    const relativeTime = DateTime.fromJSDate(lastUpdated).toRelative();
    return `Last updated ${relativeTime}`;
  });
</script>

<div
  class={`mb-4 rounded-xl border p-6 ${config.bgColor} ${config.borderColor}`}
>
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      {#if config.icon}
        {@const IconComponent = config.icon}
        <IconComponent class={`h-6 w-6 ${config.color}`} />
      {/if}

      <div>
        <h2 class={`text-lg font-semibold ${config.color}`}>
          {config.text}
        </h2>
        <p class="text-sm text-gray-600 dark:text-gray-300">
          {userFriendlyLastUpdated}
        </p>
      </div>
    </div>

    <div class="text-right">
      <div class="text-sm text-gray-500">
        {monitorCount} service{monitorCount !== 1 ? 's' : ''}
      </div>
    </div>
  </div>
</div>
