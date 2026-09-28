<script lang="ts">
  import type { Monitor } from "@logdash/status";
  import { formatUptime } from "../utils/format-status-page";
  import { isHealthyStatus } from "../utils/group-pings-by-status";
  import DailyUptimeBars from "./DailyUptimeBars.svelte";
  import ResponseTimeChart from "./ResponseTimeChart.svelte";

  interface Props {
    monitor: Monitor;
  }

  let { monitor }: Props = $props();

  const UPTIME_WINDOWS = [
    { key: "24h", label: "24 h uptime" },
    { key: "7d", label: "7 d uptime" },
    { key: "30d", label: "30 d uptime" },
    { key: "90d", label: "90 d uptime" },
  ] as const;

  const statuses: Record<Monitor["status"], { label: string; dot: string }> = {
    up: { label: "Operational", dot: "bg-success" },
    degraded: { label: "Degraded", dot: "bg-warning" },
    down: { label: "Down", dot: "bg-error" },
    unknown: { label: "Unknown", dot: "bg-neutral-600" },
  };

  const status = $derived(statuses[monitor.status]);
  const healthyPings = $derived(
    monitor.pings.filter((ping) => isHealthyStatus(ping.statusCode))
  );
  const averageMs = $derived(
    healthyPings.length
      ? healthyPings.reduce((sum, ping) => sum + ping.responseTimeMs, 0) /
          healthyPings.length
      : null
  );
  const latestPing = $derived(monitor.pings[monitor.pings.length - 1]);
</script>

<div class="flex items-start justify-between gap-4">
  <h2 class="min-w-0 text-lg font-medium tracking-[-0.01em] break-words">
    {monitor.name}
  </h2>
  <span
    class="text-neutral-400 flex h-7 shrink-0 items-center gap-2 text-sm"
  >
    <span class={["size-1.5 rounded-full", status.dot]}></span>
    {status.label}
  </span>
</div>

<dl class="mt-6 grid grid-cols-4 gap-x-3">
  {#each UPTIME_WINDOWS as window (window.key)}
    {@render stat(
      window.label,
      formatUptime(monitor.uptime[window.key]),
      monitor.uptime[window.key] === null
    )}
  {/each}
</dl>

<div class="mt-5">
  <DailyUptimeBars buckets={monitor.history.daily} label={monitor.name} />
</div>

<dl class="mt-10 grid grid-cols-2 gap-x-3 @md:grid-cols-4">
  {@render stat(
    "Avg response",
    averageMs === null ? "No data" : `${Math.round(averageMs)} ms`,
    averageMs === null
  )}
  {#if !latestPing}
    {@render stat("Latest check", "No data", true)}
  {:else if isHealthyStatus(latestPing.statusCode)}
    {@render stat("Latest check", `${latestPing.responseTimeMs} ms`)}
  {:else}
    {@render stat("Latest check", "Failed", false, "text-error")}
  {/if}
</dl>

<div class="mt-5">
  <ResponseTimeChart pings={monitor.pings} label={monitor.name} />
</div>

{#snippet stat(label: string, value: string, empty = false, tone = "")}
  <div class="flex min-w-0 flex-col gap-1">
    <dt class="text-neutral-500 truncate text-xs">{label}</dt>
    <dd
      class={[
        "truncate text-base font-medium tabular-nums @xl:text-lg",
        tone || (empty ? "text-neutral-500" : "text-fg-default"),
      ]}
    >
      {value}
    </dd>
  </div>
{/snippet}
