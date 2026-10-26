<script lang="ts">
  import * as d3 from 'd3';
  import { DateTime } from 'luxon';
  import { lastCurveSegment } from '../../domain/analytics-chart';
  import { formatCount } from '../../domain/analytics-format';
  import { whole } from '../../domain/day-analytics';
  import type { WebAnalyticsSourceSeries } from '../../domain/web-analytics';

  type Lane = { name: string; hours: number[] };

  type Props = {
    date: string;
    hours: number[];
    typical: number[] | null;
    lanes: Lane[];
    sources: WebAnalyticsSourceSeries[];
    spot: string | null;
    current: number | null;
    now: string;
  };

  const { date, hours, typical, lanes, sources, spot, current, now }: Props =
    $props();

  const PLOT = 200;
  const LANE = 20;
  const TOP = 22;
  const RIGHT = 8;
  const AXIS = 26;
  const id = $props.id();

  let width = $state(0);
  let hovered = $state<number | null>(null);

  const left = $derived(
    Math.max(
      40,
      Math.min(
        132,
        12 + Math.max(0, ...lanes.map((lane) => lane.name.length)) * 6.7,
      ),
    ),
  );
  const baseline = TOP + PLOT;
  const height = $derived(
    baseline + AXIS + (lanes.length ? 8 + lanes.length * LANE : 0),
  );
  const slot = $derived(Math.max(0, width - left - RIGHT) / 24);
  const last = $derived(current ?? 23);
  const partial = $derived(current !== null && current > 0);
  const shown = $derived(hours.slice(0, last + 1));
  const spotted = $derived(
    sources.find((source) => source.name === spot)?.visits.slice(0, last + 1) ??
      null,
  );
  const y = $derived(
    d3
      .scaleLinear()
      .domain([0, Math.max(4, ...hours, ...(typical ?? []))])
      .nice(4)
      .range([baseline, TOP]),
  );
  const ticks = $derived(y.ticks(4));
  const labels = $derived(
    Array.from({ length: 24 }, (_, hour) => hour).filter(
      (hour) => hour % (width < 560 ? 6 : 3) === 0,
    ),
  );
  const line = $derived(
    d3
      .line<number>()
      .x((_, hour) => x(hour))
      .y((value) => y(value))
      .curve(d3.curveMonotoneX),
  );
  const area = $derived(
    d3
      .area<number>()
      .x((_, hour) => x(hour))
      .y0(baseline)
      .y1((value) => y(value))
      .curve(d3.curveMonotoneX),
  );
  const clip = $derived(partial ? `url(#${id}-complete)` : undefined);
  const hourSources = $derived(
    hovered === null
      ? []
      : sources
          .map((source) => ({
            name: source.name,
            visits: source.visits[hovered!],
          }))
          .filter((source) => source.visits > 0)
          .sort((a, b) => b.visits - a.visits)
          .slice(0, 5),
  );

  function x(hour: number): number {
    return left + slot * (hour + 0.5);
  }

  function clock(hour: number): string {
    return `${String(hour % 24).padStart(2, '0')}:00`;
  }

  function hourLabel(hour: number): string {
    return DateTime.fromObject({ hour }).toFormat('ha').toLowerCase();
  }

  function onPointerMove(event: PointerEvent): void {
    const bounds = (event.currentTarget as SVGElement).getBoundingClientRect();
    const hour = Math.floor((event.clientX - bounds.left - left) / slot);
    hovered = Math.min(23, Math.max(0, hour));
  }

  function onPointerLeave(): void {
    hovered = null;
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const step = event.key === 'ArrowRight' ? 1 : -1;
    hovered = Math.min(
      23,
      Math.max(0, (hovered ?? (step > 0 ? -1 : 24)) + step),
    );
  }
</script>

<div class="relative w-full" style:height="{height}px" bind:clientWidth={width}>
  {#if width}
    <svg
      {width}
      {height}
      class="focus-visible:outline-brand block touch-pan-y rounded-lg outline-none focus-visible:outline-2"
      role="img"
      tabindex="0"
      aria-label="Visits per hour. Use the arrow keys to read each hour."
      onpointermove={onPointerMove}
      onpointerleave={onPointerLeave}
      onkeydown={onKeydown}
      onblur={onPointerLeave}
    >
      <defs>
        <linearGradient id="{id}-fill" x1="0" x2="0" y1="0" y2="1">
          <stop
            offset="0%"
            stop-color="var(--fg-default)"
            stop-opacity="0.16"
          />
          <stop offset="100%" stop-color="var(--fg-default)" stop-opacity="0" />
        </linearGradient>
        {#if partial}
          <clipPath id="{id}-complete">
            <rect width={x(last - 1)} {height} />
          </clipPath>
        {/if}
      </defs>

      {#each ticks as tick (tick)}
        <line
          x1={left}
          x2={width - RIGHT}
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

      {#each labels as hour (hour)}
        <text
          x={x(hour)}
          y={baseline + 17}
          text-anchor="middle"
          class="fill-fg-muted text-[11px]"
        >
          {hourLabel(hour)}
        </text>
      {/each}

      {#if typical}
        <path
          d={line(typical)}
          fill="none"
          stroke="var(--fg-faint)"
          stroke-width="1.5"
          stroke-dasharray="4 4"
        />
      {/if}

      <path d={area(shown)} fill="url(#{id}-fill)" clip-path={clip} />
      <path
        d={line(shown)}
        fill="none"
        stroke={spotted ? 'var(--fg-muted)' : 'var(--fg-default)'}
        stroke-width="2"
        stroke-linejoin="round"
        clip-path={clip}
        class="transition-ink duration-150"
      />
      {#if partial}
        <path
          d={lastCurveSegment(line(shown) ?? '')}
          fill="none"
          stroke={spotted ? 'var(--fg-muted)' : 'var(--fg-default)'}
          stroke-width="2"
          stroke-dasharray="3 3"
          stroke-dashoffset="3"
          class="transition-ink duration-150"
        />
      {/if}

      {#if spotted}
        <path d={area(spotted)} fill="url(#{id}-fill)" clip-path={clip} />
        <path
          d={line(spotted)}
          fill="none"
          stroke="var(--fg-default)"
          stroke-width="2"
          stroke-linejoin="round"
          clip-path={clip}
        />
        {#if partial}
          <path
            d={lastCurveSegment(line(spotted) ?? '')}
            fill="none"
            stroke="var(--fg-default)"
            stroke-width="2"
            stroke-dasharray="3 3"
            stroke-dashoffset="3"
          />
        {/if}
      {/if}

      {#if current !== null && hovered !== current}
        <circle
          cx={x(current)}
          cy={y(hours[current])}
          r="3.5"
          fill="none"
          stroke="var(--fg-default)"
          class="origin-center [transform-box:fill-box] motion-safe:animate-ping"
        />
        <circle
          cx={x(current)}
          cy={y(hours[current])}
          r="3.5"
          fill="var(--chart-surface, var(--surface-25-bg))"
          stroke="var(--fg-default)"
          stroke-width="1.5"
        />
        <text
          x={x(current) + 8}
          y={Math.min(
            y(hours[current]),
            typical ? y(typical[current]) : baseline,
          ) - 10}
          text-anchor={current > 20 ? 'end' : 'start'}
          dx={current > 20 ? -16 : 0}
          class="fill-fg-tertiary text-[11px] tabular-nums"
          stroke="var(--chart-surface, var(--surface-25-bg))"
          stroke-width="4"
          stroke-linejoin="round"
          paint-order="stroke"
        >
          {now}
        </text>
      {/if}

      {#if hovered !== null}
        <line
          x1={x(hovered)}
          x2={x(hovered)}
          y1={TOP}
          y2={baseline}
          stroke="var(--fg-disabled)"
        />
        {#if hovered <= last}
          {@const open = hovered === current}
          <circle
            cx={x(hovered)}
            cy={y((spotted ?? hours)[hovered])}
            r="4"
            fill={open
              ? 'var(--chart-surface, var(--surface-25-bg))'
              : 'var(--fg-default)'}
            stroke={open
              ? 'var(--fg-default)'
              : 'var(--chart-surface, var(--surface-25-bg))'}
            stroke-width="2"
          />
        {/if}
      {/if}

      {#each lanes as lane, index (lane.name)}
        {@const laneY = baseline + AXIS + 8 + index * LANE + LANE / 2}
        <text
          x={0}
          y={laneY}
          dy="0.32em"
          class="fill-fg-muted font-mono text-[11px]"
        >
          {lane.name}
        </text>
        <line
          x1={left}
          x2={width - RIGHT}
          y1={laneY}
          y2={laneY}
          stroke="var(--surface-50-border)"
          stroke-dasharray="1 5"
          stroke-linecap="round"
        />
        {#each lane.hours as count, hour (hour)}
          {#if count}
            {@render marker(x(hour), laneY, count, index > 0)}
          {/if}
        {/each}
      {/each}
    </svg>
  {/if}

  {#if hovered !== null}
    {@const hour = hovered}
    {@const future = current !== null && hour > current}
    <div
      class={[
        'border-surface-elevated-border bg-surface-elevated-bg pointer-events-none absolute top-2 z-10 min-w-48 rounded-xl border px-3 py-2.5 text-sm shadow-lg',
        x(hour) > width / 2
          ? '-translate-x-[calc(100%+12px)]'
          : 'translate-x-3',
      ]}
      style:left="{x(hour)}px"
    >
      <p class="text-fg-muted text-xs">
        {DateTime.fromISO(date).toFormat('ccc d LLL')}, {clock(hour)}-{clock(
          hour + 1,
        )}
      </p>
      {#if hour === current}
        <p class="text-fg-tertiary text-xs">In progress, {now}</p>
      {:else if future}
        <p class="text-fg-tertiary text-xs">Still to come</p>
      {/if}
      {#if !future}
        <p class="mt-1.5 flex items-center justify-between gap-4">
          <span class="flex items-center gap-2">
            <span class="bg-surface-inverse-bg h-0.5 w-3 rounded-full"></span>
            Visits
          </span>
          <span class="font-medium tabular-nums">
            {formatCount(hours[hour])}
          </span>
        </p>
      {/if}
      {#if typical}
        <p
          class="text-fg-tertiary mt-1 flex items-center justify-between gap-4"
        >
          <span class="flex items-center gap-2">
            <svg width="12" height="2" aria-hidden="true">
              <line
                x2="12"
                y1="1"
                y2="1"
                stroke="var(--fg-faint)"
                stroke-width="1.5"
                stroke-dasharray="3 2"
              />
            </svg>
            Typical day
          </span>
          <span class="tabular-nums">{whole(typical[hour])}</span>
        </p>
      {/if}
      {#if !future}
        {#each hourSources as source (source.name)}
          <p
            class={[
              'mt-1 flex items-center justify-between gap-4',
              source.name === spot ? 'text-fg-default' : 'text-fg-tertiary',
            ]}
          >
            <span class="max-w-40 truncate">{source.name}</span>
            <span class="tabular-nums">{formatCount(source.visits)}</span>
          </p>
        {/each}
        {#each lanes as lane (lane.name)}
          <p
            class="text-fg-tertiary mt-1 flex items-center justify-between gap-4"
          >
            <span class="truncate font-mono text-xs">{lane.name}</span>
            <span class="tabular-nums">{formatCount(lane.hours[hour])}</span>
          </p>
        {/each}
      {/if}
    </div>
  {/if}
</div>

{#snippet marker(cx: number, cy: number, count: number, second: boolean)}
  {#if slot < 20}
    <circle
      {cx}
      {cy}
      r={Math.min(4.5, 2.5 + (count - 1) * 0.5)}
      fill={second
        ? 'var(--chart-surface, var(--surface-25-bg))'
        : 'var(--fg-default)'}
      stroke={second ? 'var(--fg-tertiary)' : 'none'}
      stroke-width="1.25"
    />
  {:else if count === 1}
    <circle
      {cx}
      {cy}
      r={second ? 4 : 4.5}
      fill={second
        ? 'var(--chart-surface, var(--surface-25-bg))'
        : 'var(--fg-default)'}
      stroke={second
        ? 'var(--fg-tertiary)'
        : 'var(--chart-surface, var(--surface-25-bg))'}
      stroke-width={second ? 1.5 : 2}
    />
  {:else}
    {@const label = formatCount(count)}
    {@const size = Math.max(16, 8 + label.length * 6.4)}
    <rect
      x={cx - size / 2}
      y={cy - 7.5}
      width={size}
      height="15"
      rx="7.5"
      fill={second
        ? 'var(--chart-surface, var(--surface-25-bg))'
        : 'var(--fg-default)'}
      stroke={second ? 'var(--fg-tertiary)' : 'none'}
      stroke-width="1.25"
    />
    <text
      x={cx}
      y={cy}
      dy="0.34em"
      text-anchor="middle"
      class={[
        'text-[10px] font-semibold tabular-nums',
        second ? 'fill-fg-secondary' : 'fill-fg-inverse',
      ]}
    >
      {label}
    </text>
  {/if}
{/snippet}
