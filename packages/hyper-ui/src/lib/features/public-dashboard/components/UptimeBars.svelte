<script lang="ts">
  import type { Bucket } from "@logdash/status";
  import {
    getBucketStatus,
    getUptimeFromBucket,
    type BucketStatus,
  } from "../utils/group-buckets-by-status";
  import {
    formatCount,
    formatUptime,
    formatUtcDate,
    formatUtcHour,
  } from "../utils/format-status-page";

  type Unit = "day" | "hour";

  interface Props {
    buckets: Bucket[];
    label: string;
    unit?: Unit;
    raised?: boolean;
  }

  let { buckets, label, unit = "day", raised = false }: Props = $props();

  const TOOLTIP_WIDTH_REM = 12;

  let roving = $state<number | null>(null);
  let hovered = $state<number | null>(null);
  let focused = $state<number | null>(null);

  const current = $derived(
    Math.min(roving ?? buckets.length - 1, buckets.length - 1)
  );
  const shown = $derived(hovered ?? focused);
  const shownBucket = $derived(shown === null ? null : buckets[shown]);

  const barColors: Record<BucketStatus, string> = $derived({
    up: "bg-neutral-700",
    degraded: "bg-warning",
    down: "bg-error",
    unknown: raised ? "bg-neutral-800" : "bg-neutral-900",
  });

  const activeBarColors: Record<BucketStatus, string> = $derived({
    ...barColors,
    up: "bg-neutral-400",
    unknown: "bg-neutral-600",
  });

  const dotColors: Record<BucketStatus, string> = {
    up: "bg-success",
    degraded: "bg-warning",
    down: "bg-error",
    unknown: "bg-neutral-600",
  };

  function describe(bucket: Bucket): string {
    const when = formatSlot(bucket);
    const uptime = getUptimeFromBucket(bucket);

    if (uptime === null) {
      return `${when}: no data`;
    }

    return `${when}: ${formatUptime(uptime)} uptime, ${details(bucket, ", ")}`;
  }

  function formatSlot(bucket: Bucket): string {
    return unit === "hour"
      ? formatUtcHour(bucket.timestamp)
      : formatUtcDate(bucket.timestamp);
  }

  function details(bucket: Bucket, separator: string): string {
    const checks = formatCount(
      bucket.successCount + bucket.failureCount,
      "check"
    );

    return bucket.averageLatencyMs === null
      ? checks
      : `${checks}${separator}${Math.round(bucket.averageLatencyMs)} ms avg`;
  }

  function tooltipLeft(index: number): string {
    const center = ((index + 0.5) / buckets.length) * 100;
    const half = TOOLTIP_WIDTH_REM / 2;

    return `clamp(0rem, calc(${center}% - ${half}rem), calc(100% - ${TOOLTIP_WIDTH_REM}rem))`;
  }

  function onKeydown(event: KeyboardEvent): void {
    const last = buckets.length - 1;
    const targets: Record<string, number> = {
      ArrowLeft: current - 1,
      ArrowRight: current + 1,
      Home: 0,
      End: last,
    };
    const target = targets[event.key];

    if (target === undefined) {
      return;
    }

    event.preventDefault();
    roving = Math.max(0, Math.min(last, target));
    (event.currentTarget as HTMLElement)
      .querySelectorAll<HTMLElement>('[role="gridcell"]')
      [roving]?.focus();
  }

  function onFocusIn(index: number): void {
    roving = index;
    focused = index;
  }

  // Hover and focus content must be dismissible without moving either (WCAG 1.4.13).
  function onWindowKeydown(event: KeyboardEvent): void {
    if (event.key === "Escape") {
      hovered = null;
      focused = null;
    }
  }
</script>

<svelte:window onkeydown={onWindowKeydown} />

<div class="@container relative">
  <div
    role="grid"
    tabindex="-1"
    aria-label="{label}, {unit === 'hour' ? 'hourly' : 'daily'} uptime over the last {buckets.length} {unit}s (UTC)"
    class="-m-1 rounded-sm p-1 has-[:focus-visible]:outline-2"
    onkeydown={onKeydown}
    onpointerleave={() => (hovered = null)}
    onfocusout={() => (focused = null)}
  >
    <div role="row" class="flex h-8 gap-px @xl:gap-0.5">
      {#each buckets as bucket, index (bucket.timestamp)}
        {@const status = getBucketStatus(bucket)}
        <div
          role="gridcell"
          tabindex={index === current ? 0 : -1}
          aria-label={describe(bucket)}
          class={[
            "min-w-0 flex-1 rounded-[1px] outline-none",
            index === shown
              ? ["-my-1", activeBarColors[status]]
              : barColors[status],
          ]}
          onpointerenter={() => (hovered = index)}
          onfocus={() => onFocusIn(index)}
        ></div>
      {/each}
    </div>
  </div>

  {#if shown !== null && shownBucket}
    {@const status = getBucketStatus(shownBucket)}
    {@const uptime = getUptimeFromBucket(shownBucket)}
    <div
      aria-hidden="true"
      class="bg-surface-elevated ring-neutral-800 pointer-events-none absolute bottom-full z-10 mb-2 flex flex-col gap-1 rounded-lg px-3 py-2.5 ring-1"
      style:width="{TOOLTIP_WIDTH_REM}rem"
      style:left={tooltipLeft(shown)}
    >
      <span class="text-sm font-medium">
        {formatSlot(shownBucket)}
        <span class="text-neutral-400 font-mono text-xs font-normal">UTC</span>
      </span>
      {#if uptime === null}
        <span class="text-neutral-400 text-xs">No checks this {unit}</span>
      {:else}
        <span class="text-neutral-300 flex items-center gap-2 text-xs tabular-nums">
          <span class={["size-1.5 shrink-0 rounded-full", dotColors[status]]}
          ></span>
          {formatUptime(uptime)} uptime
        </span>
        <span class="text-neutral-400 text-xs tabular-nums">
          {details(shownBucket, " · ")}
        </span>
      {/if}
    </div>
  {/if}

  <div
    class="text-neutral-500 mt-2 flex items-center justify-between font-mono text-xs"
  >
    <span>
      {buckets.length === 0 ? "No data yet" : `${buckets.length} ${unit}s ago`}
    </span>
    <span>{unit === "hour" ? "Now" : "Today"}</span>
  </div>
</div>
