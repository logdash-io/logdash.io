<script lang="ts">
  import * as d3 from 'd3';
  import { logAnalyticsState } from '$lib/domains/logs/application/log-analytics.state.svelte.js';
  import { LOG_LEVELS } from '$lib/domains/logs/domain/log-level-metadata.js';
  import type { LogLevel } from '$lib/domains/logs/domain/log-level.js';
  import type { LogsAnalyticsResponse } from '$lib/domains/logs/domain/logs-analytics-response.js';
  import { DangerIcon } from '@logdash/hyper-ui/icons';

  type Props = {
    onDateRangeChange?: (startDate: Date, endDate: Date) => void;
  };

  type Bucket = LogsAnalyticsResponse['buckets'][number];

  type Bar = {
    x: number;
    width: number;
    segments: { y: number; height: number; color: string }[];
  };

  const { onDateRangeChange }: Props = $props();

  const HEIGHT = 72;
  const TOP = 4;
  const AXIS_HEIGHT = 20;
  const BAR_FILL = 0.8;
  const LABEL_EDGE = 24;
  const MIN_RANGE_MS = 60_000;
  const MULTI_DAY_MS = 2 * 86_400_000;
  const TIME_FORMAT: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  };
  const DATE_FORMAT: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
  };
  const SEGMENTS: { levels: LogLevel[]; color: string }[] = [
    { levels: ['error'], color: 'var(--error)' },
    { levels: ['warning'], color: 'var(--warning)' },
    {
      levels: ['info', 'http', 'verbose', 'debug', 'silly'],
      color: 'var(--surface-200-bg)',
    },
  ];

  let width = $state(0);
  let hovered = $state<number | null>(null);
  let dragStart = $state<number | null>(null);
  let dragEnd = $state<number | null>(null);

  const data = $derived(logAnalyticsState.analyticsData);
  const buckets = $derived(data?.buckets ?? []);
  const from = $derived(new Date(buckets[0]?.bucketStart ?? 0));
  const to = $derived(new Date(buckets.at(-1)?.bucketEnd ?? 0));
  const x = $derived(d3.scaleTime().domain([from, to]).range([0, width]));
  const y = $derived(
    d3
      .scaleLinear()
      .domain([0, d3.max(buckets, (bucket) => bucket.countTotal) || 1])
      .nice()
      .range([HEIGHT - AXIS_HEIGHT, TOP]),
  );
  const ticks = $derived(
    x.ticks(Math.max(2, Math.min(6, Math.floor(width / 90)))),
  );
  const multiDay = $derived(to.getTime() - from.getTime() > MULTI_DAY_MS);
  const bars = $derived(buckets.map(toBar));
  const active = $derived(
    hovered === null || dragStart !== null ? null : buckets[hovered],
  );
  const activeCenter = $derived(
    hovered === null || !bars[hovered]
      ? 0
      : bars[hovered].x + bars[hovered].width / 2,
  );

  function toBar(bucket: Bucket): Bar {
    const start = x(new Date(bucket.bucketStart));
    const end = x(new Date(bucket.bucketEnd));
    const barWidth = Math.max(1, (end - start) * BAR_FILL);
    let top = y(0);

    return {
      x: start + (end - start - barWidth) / 2,
      width: barWidth,
      segments: SEGMENTS.flatMap(({ levels, color }) => {
        const count = levels.reduce(
          (sum, level) => sum + bucket.countByLevel[level],
          0,
        );
        if (count <= 0) return [];
        const height = y(0) - y(count);
        top -= height;
        return [{ y: top, height, color }];
      }),
    };
  }

  function tickLabel(tick: Date): string {
    return multiDay
      ? tick.toLocaleDateString([], DATE_FORMAT)
      : tick.toLocaleTimeString([], TIME_FORMAT);
  }

  function bucketTitle(bucket: Bucket): string {
    const start = new Date(bucket.bucketStart);
    const end = new Date(bucket.bucketEnd);

    return `${start.toLocaleDateString([], DATE_FORMAT)}, ${start.toLocaleTimeString([], TIME_FORMAT)} - ${end.toLocaleTimeString([], TIME_FORMAT)}`;
  }

  function pointerX(event: PointerEvent): number {
    const bounds = (event.currentTarget as SVGElement).getBoundingClientRect();
    return Math.max(0, Math.min(width, event.clientX - bounds.left));
  }

  function onPointerDown(event: PointerEvent): void {
    if (event.button !== 0) return;
    (event.currentTarget as SVGElement).setPointerCapture(event.pointerId);
    dragStart = pointerX(event);
    dragEnd = dragStart;
    hovered = null;
  }

  function onPointerMove(event: PointerEvent): void {
    const position = pointerX(event);

    if (dragStart !== null) {
      dragEnd = position;
      return;
    }

    const time = x.invert(position);
    const index = buckets.findIndex(
      (bucket) =>
        time >= new Date(bucket.bucketStart) &&
        time < new Date(bucket.bucketEnd),
    );
    hovered = index === -1 ? null : index;
  }

  function onPointerUp(): void {
    if (dragStart === null || dragEnd === null) return;

    const start = x.invert(Math.min(dragStart, dragEnd));
    const end = x.invert(Math.max(dragStart, dragEnd));
    dragStart = null;
    dragEnd = null;

    if (end.getTime() - start.getTime() > MIN_RANGE_MS) {
      onDateRangeChange?.(start, end);
    }
  }

  function onPointerCancel(): void {
    dragStart = null;
    dragEnd = null;
  }

  function onPointerLeave(): void {
    hovered = null;
  }
</script>

<div class="relative h-18 w-full" bind:clientWidth={width}>
  {#if !data && logAnalyticsState.error}
    <p class="text-fg-muted flex h-full items-center gap-2 text-xs">
      <DangerIcon class="size-4" />
      Could not load log volume
    </p>
  {:else if !data}
    <div
      class="bg-surface-150-bg h-full rounded-lg"
      role="status"
      aria-label="Loading log volume"
    ></div>
  {:else if buckets.length === 0}
    <p class="text-fg-muted flex h-full items-center text-xs">
      No logs in this range
    </p>
  {:else if width}
    <svg
      {width}
      height={HEIGHT}
      class="block cursor-crosshair touch-pan-y select-none"
      role="img"
      aria-label="Log volume. Drag across the chart to narrow the time range."
      onpointerdown={onPointerDown}
      onpointermove={onPointerMove}
      onpointerup={onPointerUp}
      onpointercancel={onPointerCancel}
      onpointerleave={onPointerLeave}
    >
      {#if dragStart !== null && dragEnd !== null}
        <rect
          x={Math.min(dragStart, dragEnd)}
          y={0}
          width={Math.abs(dragEnd - dragStart)}
          height={HEIGHT - AXIS_HEIGHT}
          fill="var(--surface-25-selected-bg)"
        />
      {/if}

      {#if active}
        {@const start = x(new Date(active.bucketStart))}
        <rect
          x={start}
          y={0}
          width={x(new Date(active.bucketEnd)) - start}
          height={HEIGHT - AXIS_HEIGHT}
          fill="var(--surface-25-hover-bg)"
        />
      {/if}

      {#each bars as bar, index (index)}
        {#each bar.segments as segment (segment.color)}
          <rect
            x={bar.x}
            y={segment.y}
            width={bar.width}
            height={segment.height}
            fill={segment.color}
            shape-rendering="crispEdges"
          />
        {/each}
      {/each}

      <line
        x1={0}
        x2={width}
        y1={y(0) + 0.5}
        y2={y(0) + 0.5}
        stroke="var(--surface-25-border)"
      />

      {#each ticks as tick (tick.getTime())}
        <text
          x={x(tick)}
          y={HEIGHT - 4}
          text-anchor={x(tick) < LABEL_EDGE
            ? 'start'
            : x(tick) > width - LABEL_EDGE
              ? 'end'
              : 'middle'}
          class="fill-fg-muted text-[11px] tabular-nums"
        >
          {tickLabel(tick)}
        </text>
      {/each}
    </svg>

    {#if active}
      <div
        class={[
          'border-surface-elevated-border bg-surface-elevated-bg pointer-events-none absolute top-0 z-30 min-w-44 rounded-xl border px-3 py-2.5 text-sm shadow-lg',
          activeCenter > width / 2
            ? '-translate-x-[calc(100%+12px)]'
            : 'translate-x-3',
        ]}
        style:left="{activeCenter}px"
      >
        <p class="text-fg-muted text-xs">{bucketTitle(active)}</p>
        {#each LOG_LEVELS as level (level.value)}
          {#if active.countByLevel[level.value] > 0}
            <p class="mt-1.5 flex items-center justify-between gap-4">
              <span class="flex min-w-0 items-center gap-2">
                <span
                  class={['size-2 shrink-0 rounded-full', level.color]}
                ></span>
                <span class="truncate">{level.label}</span>
              </span>
              <span class="font-medium tabular-nums">
                {active.countByLevel[level.value].toLocaleString('en')}
              </span>
            </p>
          {/if}
        {/each}
        <p class="edge-t mt-2 flex items-center justify-between gap-4 pt-2">
          <span class="text-fg-tertiary">Total</span>
          <span class="font-medium tabular-nums">
            {active.countTotal.toLocaleString('en')}
          </span>
        </p>
      </div>
    {/if}
  {/if}
</div>
