<script lang="ts">
  import { DangerIcon } from '@logdash/hyper-ui/icons';
  import * as d3 from 'd3';
  import { match } from 'ts-pattern';
  import { thinTicks, type GraphReadyPoint } from './data.utils.js';

  type Format = 'minute' | 'hour' | 'day';
  type Props = {
    data: GraphReadyPoint[];
    label: string;
    isLoading?: boolean;
    failed?: boolean;
    format?: Format;
    timeRange: 'small' | 'large';
  };

  const {
    data,
    label,
    isLoading = false,
    failed = false,
    format = 'minute',
    timeRange,
  }: Props = $props();

  const MARGIN = { top: 12, right: 12, bottom: 28, left: 44 };
  const LINE_COLOR = 'var(--fg-default)';
  const SURFACE = 'var(--chart-surface, var(--surface-50-bg))';
  const gradientId = $props.id();
  const compact = new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  });
  const exact = new Intl.NumberFormat('en', { maximumFractionDigits: 2 });

  let width = $state(0);
  let height = $state(0);
  let hovered = $state<number | null>(null);

  const values = $derived(
    data.flatMap((point) => (point.y === null ? [] : [point.y])),
  );
  const x = $derived(
    d3
      .scaleLinear()
      .domain([0, Math.max(1, data.length - 1)])
      .range([MARGIN.left, Math.max(MARGIN.left, width - MARGIN.right)]),
  );
  const y = $derived(
    d3
      .scaleLinear()
      .domain([Math.min(0, d3.min(values) ?? 0), d3.max(values) || 1])
      .nice(4)
      .range([Math.max(MARGIN.top, height - MARGIN.bottom), MARGIN.top]),
  );
  const line = $derived(
    d3
      .line<GraphReadyPoint>()
      .defined((point) => point.y !== null)
      .x((_, index) => x(index))
      .y((point) => y(point.y ?? 0))
      .curve(d3.curveMonotoneX),
  );
  const area = $derived(
    d3
      .area<GraphReadyPoint>()
      .defined((point) => point.y !== null)
      .x((_, index) => x(index))
      .y0(y(0))
      .y1((point) => y(point.y ?? 0))
      .curve(d3.curveMonotoneX),
  );
  const ticks = $derived(y.ticks(4));
  const labelIndexes = $derived.by((): number[] => {
    const candidates = data.flatMap((point, index) =>
      showsLabel(point.x) ? [index] : [],
    );
    const shown = new Set(
      thinTicks(
        candidates.map((index) => data[index].x),
        width - MARGIN.left - MARGIN.right,
      ),
    );
    return candidates.filter((index) => shown.has(data[index].x));
  });
  const isolated = $derived(
    data.flatMap((point, index) =>
      point.y !== null &&
      (data[index - 1]?.y ?? null) === null &&
      (data[index + 1]?.y ?? null) === null
        ? [index]
        : [],
    ),
  );
  const hoveredValue = $derived(
    hovered === null ? null : (data[hovered]?.y ?? null),
  );

  function showsLabel(value: string): boolean {
    return match(format)
      .with('minute', () => {
        const minute = parseInt(value.split(':')[1], 10);
        return timeRange === 'small'
          ? minute % 5 === 0
          : minute === 0 || minute === 30;
      })
      .with('hour', () => {
        const hour = parseInt(value.split(' ')[1].split(':')[0], 10);
        return timeRange === 'small' || hour === 0 || hour === 12;
      })
      .with('day', () => true)
      .exhaustive();
  }

  function onPointerMove(event: PointerEvent): void {
    const bounds = (event.currentTarget as SVGElement).getBoundingClientRect();
    const index = Math.round(x.invert(event.clientX - bounds.left));
    hovered = Math.min(data.length - 1, Math.max(0, index));
  }

  function onPointerLeave(): void {
    hovered = null;
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const step = event.key === 'ArrowRight' ? 1 : -1;
    const start = hovered ?? (step > 0 ? -1 : data.length);
    hovered = Math.min(data.length - 1, Math.max(0, start + step));
  }
</script>

<div
  class="relative h-full w-full"
  bind:clientWidth={width}
  bind:clientHeight={height}
>
  {#if isLoading}
    <div
      class="bg-surface-150-bg h-full rounded-xl"
      role="status"
      aria-label="Loading {label}"
    ></div>
  {:else if data.length === 0}
    <p
      class="text-fg-muted flex h-full items-center justify-center gap-2 text-sm"
    >
      {#if failed}
        <DangerIcon class="size-4" />
        Could not load this metric
      {:else}
        No data in this range
      {/if}
    </p>
  {:else if width && height}
    <svg
      {width}
      {height}
      class="focus-visible:outline-brand block touch-pan-y rounded-lg outline-none focus-visible:outline-2"
      role="img"
      tabindex="0"
      aria-label="{label} over time. Use the arrow keys to read each point."
      onpointermove={onPointerMove}
      onpointerleave={onPointerLeave}
      onkeydown={onKeydown}
      onblur={onPointerLeave}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color={LINE_COLOR} stop-opacity="0.16" />
          <stop offset="100%" stop-color={LINE_COLOR} stop-opacity="0" />
        </linearGradient>
      </defs>

      {#each ticks as tick (tick)}
        <line
          x1={MARGIN.left}
          x2={width - MARGIN.right}
          y1={y(tick)}
          y2={y(tick)}
          stroke="var(--surface-25-border)"
          stroke-dasharray={tick === 0 ? undefined : '3 4'}
        />
        <text
          x={0}
          y={y(tick)}
          dy="0.32em"
          class="fill-fg-muted text-[11px] tabular-nums"
        >
          {compact.format(tick)}
        </text>
      {/each}

      {#each labelIndexes as index (index)}
        <text
          x={x(index)}
          y={height - 8}
          text-anchor={index === 0
            ? 'start'
            : index === data.length - 1
              ? 'end'
              : 'middle'}
          class="fill-fg-muted text-[11px] tabular-nums"
        >
          {data[index].x}
        </text>
      {/each}

      <path d={area(data)} fill="url(#{gradientId})" />
      <path
        d={line(data)}
        fill="none"
        stroke={LINE_COLOR}
        stroke-width="2"
        stroke-linejoin="round"
      />

      {#each isolated as index (index)}
        <circle
          cx={x(index)}
          cy={y(data[index].y ?? 0)}
          r="2.5"
          fill={LINE_COLOR}
        />
      {/each}

      {#if hovered !== null && hoveredValue !== null}
        <line
          x1={x(hovered)}
          x2={x(hovered)}
          y1={MARGIN.top}
          y2={height - MARGIN.bottom}
          stroke="var(--fg-disabled)"
        />
        <circle
          cx={x(hovered)}
          cy={y(hoveredValue)}
          r="4"
          fill={LINE_COLOR}
          stroke={SURFACE}
          stroke-width="2"
        />
      {/if}
    </svg>

    {#if hovered !== null && hoveredValue !== null}
      <div
        class={[
          'border-surface-elevated-border bg-surface-elevated-bg pointer-events-none absolute top-2 z-10 min-w-44 rounded-xl border px-3 py-2.5 text-sm shadow-lg',
          x(hovered) > width / 2
            ? '-translate-x-[calc(100%+12px)]'
            : 'translate-x-3',
        ]}
        style:left="{x(hovered)}px"
      >
        <p class="text-fg-muted text-xs">{data[hovered].x}</p>
        <p class="mt-1.5 flex items-center justify-between gap-4">
          <span class="flex min-w-0 items-center gap-2">
            <span
              class="size-2 shrink-0 rounded-full"
              style:background-color={LINE_COLOR}
            ></span>
            <span class="truncate">{label}</span>
          </span>
          <span class="font-medium tabular-nums">
            {exact.format(hoveredValue)}
          </span>
        </p>
      </div>
    {/if}
  {/if}
</div>
