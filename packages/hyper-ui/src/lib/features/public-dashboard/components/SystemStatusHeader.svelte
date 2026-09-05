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
      icon: CheckIcon,
    },
    degraded: {
      text: "Partial System Outage",
      color: "text-yellow-600",
      icon: DangerIcon,
    },
    outage: {
      text: "Major System Outage",
      color: "text-red-600",
      icon: CloseIcon,
    },
    unknown: {
      text: "Status Unknown",
      color: "text-neutral-600",
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
