<script lang="ts">
  import { DateTime } from "luxon";
  import { CheckIcon, DangerIcon, CloseIcon, ClockIcon } from "../../../icons";
  import { onMount } from "svelte";

  type SystemStatus = "operational" | "degraded" | "outage" | "unknown";

  interface Props {
    systemStatus: SystemStatus;
    lastUpdated: Date;
    monitorCount: number;
  }

  let { systemStatus, lastUpdated, monitorCount }: Props = $props();

  const statusConfig = {
    operational: {
      text: "All Systems Operational",
      color: "text-green-600",
      bgColor:
        "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/20",
      borderColor: "border-green-200 dark:border-success/5",
      icon: CheckIcon,
    },
    degraded: {
      text: "Partial System Outage",
      color: "text-yellow-600",
      bgColor:
        "bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-900/20",
      borderColor: "border-yellow-200 dark:border-yellow-800/10",
      icon: DangerIcon,
    },
    outage: {
      text: "Major System Outage",
      color: "text-red-600",
      bgColor:
        "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/20",
      borderColor: "border-red-200 dark:border-red-800/10",
      icon: CloseIcon,
    },
    unknown: {
      text: "Status Unknown",
      color: "text-neutral-600",
      bgColor:
        "bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800/40 dark:to-neutral-800/40",
      borderColor: "border-neutral-200 dark:border-neutral-800/50",
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
      (now.getTime() - lastUpdated.getTime()) / 1000
    );

    if (diffInSeconds < 10) {
      return "Updated just now";
    }

    if (diffInSeconds < 60) {
      return `Updated less than a minute ago`;
    }

    const relativeTime = DateTime.fromJSDate(lastUpdated).toRelative();
    return `Last updated ${relativeTime}`;
  });
</script>

<div class={`mb-1.5 ld-card-rounding px-3 py-1.5`}>
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-2">
      {#if config.icon}
        {@const IconComponent = config.icon}
        <IconComponent class={`size-5 ${config.color}`} />
      {/if}

      <h2 class={`text-base font-normal ${config.color}`}>
        {config.text}
      </h2>
    </div>

    <div class="text-right">
      <div class="text-sm text-neutral-500">
        {monitorCount} component{monitorCount !== 1 ? "s" : ""}
      </div>
    </div>
  </div>
</div>
