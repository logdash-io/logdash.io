<script lang="ts">
  import { Tooltip } from '@logdash/hyper-ui/presentational';
  import * as d3 from 'd3';
  import { DateTime } from 'luxon';
  import { formatCount } from '../../domain/analytics-format';
  import {
    formatRate,
    whole,
    type StripDay,
    type StripSummary,
  } from '../../domain/day-analytics';
  import { DayScrub, REST_MS } from './day-scrub';

  type Props = {
    days: StripDay[];
    summary: StripSummary;
    selected: string;
    goals: string[];
    spot: number[] | null;
    now: string;
    title: string;
    onpreview: (date: string | null) => void;
    onselect: (date: string) => void;
  };

  const {
    days,
    summary,
    selected,
    goals,
    spot,
    now,
    title,
    onpreview,
    onselect,
  }: Props = $props();

  const TOP = 22;
  const RIGHT = 8;

  const scrub = new DayScrub();

  let width = $state(0);
  let hovered = $state<number | null>(null);
  let columns = $state<(SVGRectElement | undefined)[]>([]);
  let resting: ReturnType<typeof setTimeout> | undefined;

  const loading = $derived(!days.length);
  const goal = $derived(goals[0] ?? null);
  const lane = $derived(goal !== null || loading);
  const narrow = $derived(width > 0 && width < 560);
  const left = $derived(narrow ? 36 : 44);
  const plot = $derived(narrow ? 120 : 150);
  const rateTop = $derived(TOP + plot + 30);
  const rateHeight = $derived(narrow ? 56 : 64);
  const axis = $derived((lane ? rateTop + rateHeight : TOP + plot) + 10);
  const height = $derived(axis + (narrow ? 18 : 34));
  const slot = $derived(
    Math.max(0, width - left - RIGHT) / Math.max(1, days.length),
  );
  const bar = $derived(Math.max(3, Math.min(16, slot * 0.46)));
  const band = $derived(Math.max(5, Math.min(30, slot * 0.84)));
  const y = $derived(
    d3
      .scaleLinear()
      .domain([
        0,
        Math.max(
          4,
          ...days.map((day) =>
            Math.max(
              day.counts.visits,
              day.typical.visitsRange?.[1] ?? 0,
              day.inProgress ? (day.fullVisits ?? 0) : 0,
            ),
          ),
        ),
      ])
      .nice(3)
      .range([TOP + plot, TOP]),
  );
  const rate = $derived(
    d3
      .scaleLinear()
      .domain([
        0,
        Math.max(
          4,
          ...days.map((day) =>
            Math.max(
              day.counts.goals[0] ?? 0,
              day.typical.goalRanges[0]?.[1] ?? 0,
            ),
          ),
        ),
      ])
      .nice(3)
      .range([rateTop + rateHeight, rateTop]),
  );
  const scrubbed = $derived(hovered === null ? null : days[hovered]);

  function cx(index: number): number {
    return left + slot * (index + 0.5);
  }

  function barPath(center: number, top: number, bottom: number): string {
    const radius = Math.min(4, bottom - top, bar / 2);
    const start = center - bar / 2;
    if (bottom - top <= 0) return '';
    return `M${start},${bottom}V${top + radius}Q${start},${top} ${start + radius},${top}H${start + bar - radius}Q${start + bar},${top} ${start + bar},${top + radius}V${bottom}Z`;
  }

  function fill(day: StripDay, index: number): string {
    if (spot)
      return day.date === selected
        ? 'var(--fg-faint)'
        : 'var(--surface-200-bg)';
    if (day.date === selected) return 'var(--fg-default)';
    return index === hovered ? 'var(--fg-muted)' : 'var(--fg-disabled)';
  }

  function columnAt(event: PointerEvent): number | null {
    const bounds = (event.currentTarget as SVGElement).getBoundingClientRect();
    const index = Math.floor((event.clientX - bounds.left - left) / slot);
    return index >= 0 && index < days.length ? index : null;
  }

  function onPointerMove(event: PointerEvent): void {
    if (event.pointerType === 'touch') return;
    const index = columnAt(event);
    hovered = index;
    clearTimeout(resting);
    resting = setTimeout(() => preview(scrub.rest()), REST_MS);
    preview(
      scrub.move(
        { x: event.clientX, y: event.clientY, time: event.timeStamp },
        index !== null && days[index].tracked ? index : null,
      ),
    );
  }

  function onPointerLeave(event: PointerEvent): void {
    clearTimeout(resting);
    hovered = null;
    const target = scrub.leave(event.timeStamp);
    if (target === null) onpreview(null);
    else onselect(days[target].date);
  }

  function preview(index: number | null): void {
    if (index !== null && days[index].date !== selected)
      onpreview(days[index].date);
  }

  function onColumnFocus(index: number): void {
    hovered = index;
    if (days[index].tracked) onselect(days[index].date);
  }

  function onColumnKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onselect(days[index].date);
      return;
    }
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const next = Math.min(
      days.length - 1,
      Math.max(0, index + (event.key === 'ArrowRight' ? 1 : -1)),
    );
    columns[next]?.focus();
  }

  function longDate(date: string): string {
    return DateTime.fromISO(date).toFormat('cccc d LLLL');
  }
</script>

<section
  class="bg-surface-25-bg flex min-w-0 flex-col gap-2 rounded-2xl p-2 [--chart-surface:var(--surface-25-bg)]"
  aria-label={title}
>
  <header
    class="flex min-h-7 flex-wrap items-center justify-between gap-x-3 gap-y-1"
  >
    <h2 class="px-3 text-[13px] font-medium">
      {title}
      <span class="text-fg-muted font-normal">
        one column per day, point at one to open it
      </span>
    </h2>
    <Tooltip
      content={averagesHint}
      placement="bottom"
      align="right"
      class="flex-wrap gap-x-5 gap-y-1 px-3 text-xs"
    >
      {@render average('Visits a day', whole(summary.visits))}
      {@render average('Stayed', formatRate(summary.stayRate))}
      {#each goals as name, index (name)}
        {@render average(name, whole(summary.goals[index] ?? null), true)}
      {/each}
      {@render average('Days flagged', String(summary.flagged))}
    </Tooltip>
  </header>

  <div
    class="relative w-full"
    style:height="{height}px"
    bind:clientWidth={width}
  >
    {#if loading}
      <div class="bg-surface-150-bg h-full rounded-xl"></div>
    {:else if width}
      <svg
        {width}
        {height}
        class="block"
        role="group"
        aria-label="Visits{goal ? ` and people who did ${goal}` : ''} per day"
        onpointermove={onPointerMove}
        onpointerleave={onPointerLeave}
      >
        {#each days as day, index (day.date)}
          {#if day.date === selected || index === hovered}
            <rect
              x={left + slot * index + 1}
              y={TOP - 16}
              width={Math.max(0, slot - 2)}
              height={height - TOP + 16}
              rx="6"
              fill={day.date === selected
                ? 'var(--surface-25-selected-bg)'
                : 'var(--surface-25-hover-bg)'}
            />
          {/if}
        {/each}

        {#each y.ticks(3) as tick (tick)}
          <line
            x1={left - 4}
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
        <text x={left} y={TOP - 10} class="fill-fg-tertiary text-[11px]">
          Visits
        </text>

        {#if goal}
          {#each rate.ticks(3) as tick (tick)}
            <line
              x1={left - 4}
              x2={width - RIGHT}
              y1={rate(tick)}
              y2={rate(tick)}
              stroke="var(--surface-50-border)"
              stroke-dasharray={tick === 0 ? undefined : '3 4'}
            />
            <text
              x={0}
              y={rate(tick)}
              dy="0.32em"
              class="fill-fg-muted text-[11px] tabular-nums"
            >
              {formatCount(tick)}
            </text>
          {/each}
          <text x={left} y={rateTop - 10} class="fill-fg-tertiary text-[11px]">
            <tspan class="font-mono">{goal}</tspan>
            people
          </text>
        {/if}

        {#each days as day, index (day.date)}
          {@const center = cx(index)}
          {@const local = DateTime.fromISO(day.date)}
          {@const range = day.typical.visitsRange}
          {@const typical = day.typical.visits}
          {@const goalVerdict = day.verdict.goals[0]}
          {@const goalRange = day.typical.goalRanges[0]}
          {@const lit = day.date === selected}
          {#if day.tracked}
            {#if range}
              <rect
                x={center - band / 2}
                y={Math.min(
                  y(range[1]),
                  (typical === null ? y(range[1]) : y(typical)) - 2,
                )}
                width={band}
                height={Math.max(4, y(range[0]) - y(range[1]))}
                rx="2"
                fill="var(--surface-150-bg)"
              />
            {/if}
            <path
              d={barPath(center, y(day.counts.visits), y(0))}
              fill={fill(day, index)}
              class="transition-ink duration-150"
            />
            {#if spot && spot[index]}
              <path
                d={barPath(center, y(spot[index]), y(0))}
                fill="var(--fg-default)"
              />
            {/if}
            {#if typical !== null}
              <line
                x1={center - band / 2}
                x2={center + band / 2}
                y1={y(typical)}
                y2={y(typical)}
                stroke={lit ? 'var(--fg-tertiary)' : 'var(--fg-faint)'}
                stroke-width="1.5"
                class="transition-ink duration-150"
              />
            {/if}
            {#if day.inProgress && day.fullVisits}
              <rect
                x={center - bar / 2 - 2.5}
                y={y(day.fullVisits)}
                width={bar + 5}
                height={y(0) - y(day.fullVisits)}
                rx="5"
                fill="none"
                stroke={lit ? 'var(--fg-tertiary)' : 'var(--fg-faint)'}
                stroke-dasharray="3 3"
                class="transition-ink duration-150"
              />
            {/if}
            {#if day.verdict.visits.flag}
              {@render arrow(
                center,
                Math.min(
                  y(day.counts.visits),
                  range ? y(range[1]) : Infinity,
                  day.inProgress && day.fullVisits
                    ? y(day.fullVisits)
                    : Infinity,
                ) - 8,
                day.verdict.visits.flag,
              )}
            {/if}

            {#if goal && goalVerdict}
              {#if goalRange}
                <rect
                  x={center - band / 2}
                  y={rate(goalRange[1])}
                  width={band}
                  height={Math.max(2, rate(goalRange[0]) - rate(goalRange[1]))}
                  rx="2"
                  fill="var(--surface-150-bg)"
                />
              {/if}
              {#if goalVerdict.typical !== null}
                <line
                  x1={center - band / 2}
                  x2={center + band / 2}
                  y1={rate(goalVerdict.typical)}
                  y2={rate(goalVerdict.typical)}
                  stroke={lit ? 'var(--fg-faint)' : 'var(--fg-disabled)'}
                  stroke-width="1.5"
                  class="transition-ink duration-150"
                />
              {/if}
              <circle
                cx={center}
                cy={rate(goalVerdict.value)}
                r={narrow ? 3 : 3.5}
                fill={day.inProgress
                  ? 'var(--chart-surface)'
                  : lit
                    ? 'var(--fg-default)'
                    : 'var(--fg-muted)'}
                stroke={!day.inProgress
                  ? 'var(--chart-surface)'
                  : lit
                    ? 'var(--fg-default)'
                    : 'var(--fg-muted)'}
                stroke-width={day.inProgress ? 1.5 : 2}
                class="transition-ink duration-150"
              />
              {#if goalVerdict.flag}
                {@render arrow(
                  center,
                  Math.min(
                    rate(goalVerdict.value),
                    goalRange ? rate(goalRange[1]) : Infinity,
                  ) - 8,
                  goalVerdict.flag,
                )}
              {/if}
            {/if}
          {/if}

          {#if !narrow}
            <text
              x={center}
              y={axis + 4}
              dy="0.7em"
              text-anchor="middle"
              class={[
                'text-[11px]',
                day.date === selected ? 'fill-fg-default' : 'fill-fg-muted',
              ]}
            >
              {local.toFormat('ccccc')}
            </text>
          {/if}
          {#if day.inProgress}
            <text
              x={center + slot / 2}
              y={axis + (narrow ? 4 : 20)}
              dy="0.7em"
              text-anchor="end"
              class="fill-fg-secondary text-[11px]"
            >
              Today
            </text>
          {:else if local.weekday === 1 && index < days.length - 2}
            <text
              x={center - slot / 2 + 2}
              y={axis + (narrow ? 4 : 20)}
              dy="0.7em"
              class="fill-fg-muted text-[11px]"
            >
              {local.toFormat('d LLL')}
            </text>
          {/if}
        {/each}

        {#each days as day, index (day.date)}
          <rect
            bind:this={columns[index]}
            x={left + slot * index}
            y={TOP - 16}
            width={slot}
            height={height - TOP + 16}
            fill="transparent"
            class={[
              'outline-none',
              day.tracked ? 'cursor-pointer' : 'cursor-default',
            ]}
            role="button"
            tabindex={day.date === selected ? 0 : -1}
            aria-label="{longDate(day.date)}: {formatCount(
              day.counts.visits,
            )} visits"
            aria-pressed={day.date === selected}
            onfocus={() => onColumnFocus(index)}
            onblur={() => (hovered = null)}
            onclick={() => day.tracked && onselect(day.date)}
            onkeydown={(event) => onColumnKeydown(event, index)}
          />
        {/each}
      </svg>
    {/if}

    {#if scrubbed && hovered !== null}
      <span
        class="bg-surface-elevated-bg edge text-fg-default pointer-events-none absolute z-10 flex h-5 -translate-x-1/2 items-center rounded-md px-1.5 text-[11px] whitespace-nowrap tabular-nums shadow-sm"
        style:left="{Math.min(width - 40, Math.max(40, cx(hovered)))}px"
        style:top="{axis + 2}px"
      >
        {#if !scrubbed.tracked}
          No data yet
        {:else if scrubbed.inProgress}
          Today, {now}
        {:else}
          {DateTime.fromISO(scrubbed.date).toFormat('ccc d LLL')}
        {/if}
      </span>
    {/if}
  </div>

  <div class="text-fg-muted flex flex-wrap gap-x-3.5 gap-y-1 px-3 pb-1 text-xs">
    <span class="flex items-center gap-1.5">
      <svg width="8" height="8" aria-hidden="true">
        <rect width="8" height="8" rx="2" fill="var(--fg-disabled)" />
      </svg>
      Visits
    </span>
    <span class="flex items-center gap-1.5">
      <svg width="10" height="10" aria-hidden="true">
        <rect width="10" height="10" rx="2" fill="var(--surface-150-bg)" />
        <line
          x2="10"
          y1="5"
          y2="5"
          stroke="var(--fg-faint)"
          stroke-width="1.5"
        />
      </svg>
      Typical range, middle half of the same weekday
    </span>
    {#if goal}
      <span class="flex items-center gap-1.5">
        <svg width="8" height="8" aria-hidden="true">
          <circle cx="4" cy="4" r="3.5" fill="var(--fg-muted)" />
        </svg>
        <span>
          People who did
          <span class="font-mono">{goal}</span>
          , counted on their own
        </span>
      </span>
    {/if}
  </div>
</section>

{#snippet average(label: string, value: string, mono = false)}
  <span class="flex items-baseline gap-1.5 whitespace-nowrap">
    <span class={['text-fg-muted', { 'font-mono': mono }]}>{label}</span>
    <span class="text-fg-secondary font-mono text-sm">{value}</span>
  </span>
{/snippet}

{#snippet averagesHint()}
  <p
    class="bg-surface-elevated-bg edge text-fg-secondary max-w-72 rounded-lg px-3 py-2 text-xs leading-5 whitespace-normal shadow"
  >
    Averages of the complete days shown. Each day is one sample: visits are
    never added up across days, since one person on two days is two visits. Each
    goal counts the people who did it that day, on your website or in your apps,
    on its own.
  </p>
{/snippet}

{#snippet arrow(x: number, y: number, flag: number)}
  <text
    {x}
    {y}
    text-anchor="middle"
    class="text-xs font-semibold"
    fill={flag > 0 ? 'var(--success-fg)' : 'var(--error-fg)'}
  >
    {flag > 0 ? '↑' : '↓'}
  </text>
{/snippet}
