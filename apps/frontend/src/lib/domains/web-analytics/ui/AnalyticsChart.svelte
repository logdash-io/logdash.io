<script lang="ts">
  import * as d3 from 'd3';
  import type { ClassValue } from 'svelte/elements';
  import {
    bucketLabel,
    bucketTitle,
    formatCount,
  } from '../domain/analytics-format';
  import type {
    AnalyticsChartLine,
    WebAnalyticsGranularity,
  } from '../domain/web-analytics';

  type Props = {
    times: number[];
    lines: AnalyticsChartLine[];
    granularity: WebAnalyticsGranularity;
    partial: boolean;
    label: string;
    class?: ClassValue;
  };

  const {
    times,
    lines,
    granularity,
    partial,
    label,
    class: className = 'h-55',
  }: Props = $props();

  const MARGIN = { top: 12, right: 12, bottom: 28, left: 40 };
  const gradientId = $props.id();

  let width = $state(0);
  let height = $state(0);
  let hovered = $state<number | null>(null);

  const x = $derived(
    d3
      .scaleLinear()
      .domain([0, Math.max(1, times.length - 1)])
      .range([MARGIN.left, Math.max(MARGIN.left, width - MARGIN.right)]),
  );
  const y = $derived(
    d3
      .scaleLinear()
      .domain([
        0,
        Math.max(4, d3.max(lines.flatMap((line) => line.values)) ?? 0),
      ])
      .nice(4)
      .range([Math.max(MARGIN.top, height - MARGIN.bottom), MARGIN.top]),
  );
  const path = $derived(
    d3
      .line<number>()
      .x((_, index) => x(index))
      .y((value) => y(value))
      .curve(d3.curveMonotoneX),
  );
  const fill = $derived(
    d3
      .area<number>()
      .x((_, index) => x(index))
      .y0(y(0))
      .y1((value) => y(value))
      .curve(d3.curveMonotoneX),
  );
  const ticks = $derived(y.ticks(4));
  const labelIndexes = $derived.by((): number[] => {
    const count = Math.max(2, Math.min(7, Math.floor(width / 110)));
    if (times.length <= count) return times.map((_, index) => index);
    const step = (times.length - 1) / (count - 1);
    return Array.from({ length: count }, (_, index) =>
      Math.round(index * step),
    );
  });

  const partialIndex = $derived(partial ? times.length - 1 : -1);

  function complete(line: AnalyticsChartLine): number[] {
    return partial && !line.dashed ? line.values.slice(0, -1) : line.values;
  }

  function isPartialPoint(line: AnalyticsChartLine, index: number): boolean {
    return index === partialIndex && !line.dashed;
  }

  function onPointerMove(event: PointerEvent): void {
    const bounds = (event.currentTarget as SVGElement).getBoundingClientRect();
    const index = Math.round(x.invert(event.clientX - bounds.left));
    hovered = Math.min(times.length - 1, Math.max(0, index));
  }

  function onPointerLeave(): void {
    hovered = null;
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const step = event.key === 'ArrowRight' ? 1 : -1;
    const start = hovered ?? (step > 0 ? -1 : times.length);
    hovered = Math.min(times.length - 1, Math.max(0, start + step));
  }
</script>

<div
  class={['relative w-full', className]}
  bind:clientWidth={width}
  bind:clientHeight={height}
>
  {#if width && height}
    <svg
      {width}
      {height}
      class="focus-visible:outline-brand block touch-pan-y rounded-lg outline-none focus-visible:outline-2"
      role="img"
      tabindex="0"
      aria-label="{label}. Use the arrow keys to read each {granularity}."
      onpointermove={onPointerMove}
      onpointerleave={onPointerLeave}
      onkeydown={onKeydown}
      onblur={onPointerLeave}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop
            offset="0%"
            stop-color="var(--fg-default)"
            stop-opacity="0.16"
          />
          <stop offset="100%" stop-color="var(--fg-default)" stop-opacity="0" />
        </linearGradient>
      </defs>

      {#each ticks as tick (tick)}
        <line
          x1={MARGIN.left}
          x2={width - MARGIN.right}
          y1={y(tick)}
          y2={y(tick)}
          stroke="var(--surface-50-border)"
          stroke-dasharray={tick === 0 ? undefined : '3 4'}
        />
        <text
          x={0}
          y={y(tick)}
          dy="0.32em"
          class="fill-fg-muted text-[11px] tabular-nums"
        >
          {formatCount(tick)}
        </text>
      {/each}

      {#each labelIndexes as index (index)}
        <text
          x={x(index)}
          y={height - 8}
          text-anchor={index === 0
            ? 'start'
            : index === times.length - 1
              ? 'end'
              : 'middle'}
          class="fill-fg-muted text-[11px]"
        >
          {bucketLabel(times[index], granularity)}
        </text>
      {/each}

      {#each lines as line (line.label)}
        {#if line.area}
          <path d={fill(complete(line))} fill="url(#{gradientId})" />
        {/if}
      {/each}

      {#each lines as line (line.label)}
        <path
          d={path(complete(line))}
          fill="none"
          stroke={line.color}
          stroke-width={line.dashed ? 1.5 : 2}
          stroke-dasharray={line.dashed ? '4 4' : undefined}
          stroke-linejoin="round"
        />
        {#if isPartialPoint(line, partialIndex) && hovered !== partialIndex}
          <circle
            cx={x(partialIndex)}
            cy={y(line.values[partialIndex])}
            r="3.5"
            fill="var(--chart-surface, var(--surface-50-bg))"
            stroke={line.color}
            stroke-width="1.5"
          />
        {/if}
      {/each}

      {#if hovered !== null}
        <line
          x1={x(hovered)}
          x2={x(hovered)}
          y1={MARGIN.top}
          y2={height - MARGIN.bottom}
          stroke="var(--fg-disabled)"
        />
        {@const index = hovered}
        {#each lines as line (line.label)}
          {#if !line.dashed && line.values[index] !== undefined}
            {@const open = isPartialPoint(line, index)}
            <circle
              cx={x(index)}
              cy={y(line.values[index])}
              r="4"
              fill={open
                ? 'var(--chart-surface, var(--surface-50-bg))'
                : line.color}
              stroke={open
                ? line.color
                : 'var(--chart-surface, var(--surface-50-bg))'}
              stroke-width="2"
            />
          {/if}
        {/each}
      {/if}
    </svg>
  {/if}

  {#if hovered !== null && times[hovered] !== undefined}
    {@const index = hovered}
    <div
      class={[
        'border-surface-elevated-border bg-surface-elevated-bg pointer-events-none absolute top-2 z-10 min-w-44 rounded-xl border px-3 py-2.5 text-sm shadow-lg',
        x(index) > width / 2
          ? '-translate-x-[calc(100%+12px)]'
          : 'translate-x-3',
      ]}
      style:left="{x(index)}px"
    >
      <p class="text-fg-muted text-xs">
        {bucketTitle(times[index], granularity)}
      </p>
      {#if index === partialIndex}
        <p class="text-fg-tertiary text-xs">In progress</p>
      {/if}
      {#each lines as line (line.label)}
        {#if line.values[index] !== undefined}
          <p
            class={[
              'mt-1.5 flex items-center justify-between gap-4',
              { 'text-fg-tertiary': line.dashed },
            ]}
          >
            <span class="flex min-w-0 items-center gap-2">
              <span
                class="size-2 shrink-0 rounded-full"
                style:background-color={line.color}
              ></span>
              <span class="truncate">{line.label}</span>
            </span>
            <span class="font-medium tabular-nums">
              {line.values[index].toLocaleString('en')}
            </span>
          </p>
        {/if}
      {/each}
    </div>
  {/if}
</div>
