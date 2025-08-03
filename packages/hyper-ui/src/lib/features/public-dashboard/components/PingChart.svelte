<script lang="ts">
  import { DateTime } from "luxon";
  import StatusBar from "./StatusBar.svelte";
  import Tooltip from "../../../presentational/Tooltip.svelte";

  interface Ping {
    createdAt: string;
    statusCode: number;
    responseTimeMs: number;
  }

  interface Props {
    class?: string;
    pings: Ping[];
    maxPingsToShow?: number;
    adaptToWidth?: boolean;
  }

  let {
    pings,
    maxPingsToShow = 90,
    adaptToWidth = false,
    class: className,
  }: Props = $props();

  let containerWidth = $state(0);
  const BAR_WIDTH = 8;

  function formatDuration(ms: number): string {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }

  const availableSlots = $derived(
    adaptToWidth ? Math.floor(containerWidth / BAR_WIDTH) : maxPingsToShow
  );

  const pingsCount = $derived(pings?.length || 0);
  const displayPings = $derived(
    pings?.slice(0, availableSlots).reverse() || []
  );
  const remainingSlots = $derived(Math.max(0, availableSlots - pingsCount));
</script>

<div
  class={[
    "w-full space-y-2",
    className,
    {
      "overflow-hidden": adaptToWidth,
    },
  ]}
  bind:clientWidth={containerWidth}
>
  <div
    class={[
      "flex h-8 w-full flex-row-reverse items-end justify-start",
      {
        "overflow-hidden": adaptToWidth,
      },
    ]}
  >
    {#if pingsCount === 0}
      <div
        class="h-8 w-2 flex-shrink-0 rounded-sm bg-gray-200 dark:bg-gray-600"
        title="No pings available"
      ></div>
    {/if}

    {#each displayPings as ping, pingIndex (pingIndex)}
      {@const isHealthy = ping.statusCode >= 200 && ping.statusCode < 400}
      {@const pingStatus = isHealthy ? "healthy" : "unhealthy"}
      {@const isUnknown = !ping.statusCode || ping.statusCode === 0}
      <Tooltip
        class="relative"
        content={`${DateTime.fromJSDate(new Date(ping.createdAt)).toFormat("HH:mm")} - code ${ping.statusCode} (${formatDuration(ping.responseTimeMs)})`}
        placement="top"
      >
        <StatusBar status={isUnknown ? "unknown" : pingStatus} />
      </Tooltip>
    {/each}

    {#each Array.from({ length: remainingSlots }) as _, i (i)}
      <Tooltip content="No data available" placement="top">
        <StatusBar status={"unknown"} />
      </Tooltip>
    {/each}
  </div>

  <div
    class="text-secondary/60 flex items-center justify-between font-mono text-xs"
  >
    <span>
      {availableSlots} pings ago
    </span>
    <span>Now</span>
  </div>
</div>
