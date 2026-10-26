<script lang="ts">
  import { Tooltip } from '@logdash/hyper-ui/presentational';
  import * as d3 from 'd3';
  import { DateTime } from 'luxon';
  import { formatCount } from '../../domain/analytics-format';
  import {
    formatInterval,
    formatRate,
    verdictLabel,
    whole,
    type StripDay,
    type StripSummary,
  } from '../../domain/day-analytics';

  type Props = {
    days: StripDay[];
    summary: StripSummary;
    selected: string;
    goal: string | null;
    spot: number[] | null;
    now: string;
    title: string;
    onselect: (date: string) => void;
    onprefetch: (date: string) => void;
  };

  const {
    days,
    summary,
    selected,
    goal,
    spot,
    now,
    title,
    onselect,
    onprefetch,
  }: Props = $props();

  const TOP = 22;
  const RIGHT = 8;

  let width = $state(0);
  let hovered = $state<number | null>(null);
  let columns = $state<(SVGRectElement | undefined)[]>([]);

  const narrow = $derived(width < 560);
  const left = $derived(narrow ? 36 : 44);
  const plot = $derived(narrow ? 120 : 150);
  const rateTop = $derived(TOP + plot + 30);
  const rateHeight = $derived(narrow ? 56 : 64);
  const axis = $derived((goal ? rateTop + rateHeight : TOP + plot) + 10);
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
          0.01,
          ...days.map((day) => (day.typical.goalRateRanges[0]?.[1] ?? 0) * 1.6),
          ...days.map((day) => (day.verdict.goals[0]?.rate ?? 0) * 1.15),
        ),
      ])
      .nice(3)
      .range([rateTop + rateHeight, rateTop])
      .clamp(true),
  );
  const tip = $derived(hovered === null ? null : days[hovered]);

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
    return index === hovered ? 'var(--fg-muted)' : 'var(--fg-faint)';
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

  function onColumnEnter(index: number): void {
    hovered = index;
    if (days[index].tracked) onprefetch(days[index].date);
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
        one column per day, click one to open it
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
      {#if goal}
        {@render average(goal, formatRate(summary.goalRate), true)}
      {/if}
      {@render average('Days flagged', String(summary.flagged))}
    </Tooltip>
  </header>

  <div
    class="relative w-full"
    style:height="{height}px"
    bind:clientWidth={width}
  >
    {#if width}
      <svg
        {width}
        {height}
        class="block"
        role="group"
        aria-label="Visits{goal ? ` and ${goal} rate` : ''} per day"
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
              {Math.round(tick * 1000) / 10}%
            </text>
          {/each}
          <text x={left} y={rateTop - 10} class="fill-fg-tertiary text-[11px]">
            <tspan class="font-mono">{goal}</tspan>
            rate
          </text>
        {/if}

        {#each days as day, index (day.date)}
          {@const center = cx(index)}
          {@const local = DateTime.fromISO(day.date)}
          {@const range = day.typical.visitsRange}
          {@const typical = day.typical.visits}
          {@const goalVerdict = day.verdict.goals[0]}
          {@const goalRange = day.typical.goalRateRanges[0]}
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
                stroke="var(--fg-tertiary)"
                stroke-width="1.5"
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
                stroke="var(--fg-tertiary)"
                stroke-dasharray="3 3"
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
                  stroke="var(--fg-faint)"
                  stroke-width="1.5"
                />
              {/if}
              {#if goalVerdict.interval && goalVerdict.rate !== null}
                <line
                  x1={center}
                  x2={center}
                  y1={rate(goalVerdict.interval[1])}
                  y2={rate(goalVerdict.interval[0])}
                  stroke="var(--fg-tertiary)"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
                <circle
                  cx={center}
                  cy={rate(goalVerdict.rate)}
                  r={narrow ? 3 : 3.5}
                  fill={day.inProgress
                    ? 'var(--chart-surface)'
                    : 'var(--fg-default)'}
                  stroke={day.inProgress
                    ? 'var(--fg-default)'
                    : 'var(--chart-surface)'}
                  stroke-width={day.inProgress ? 1.5 : 2}
                />
                {#if goalVerdict.flag}
                  {@render arrow(
                    center,
                    rate(goalVerdict.interval[1]) - 8,
                    goalVerdict.flag,
                  )}
                {/if}
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
            onpointerenter={() => onColumnEnter(index)}
            onpointerleave={() => (hovered = null)}
            onfocus={() => onColumnEnter(index)}
            onblur={() => (hovered = null)}
            onclick={() => day.tracked && onselect(day.date)}
            onkeydown={(event) => onColumnKeydown(event, index)}
          />
        {/each}
      </svg>
    {/if}

    {#if tip && hovered !== null}
      {@const center = cx(hovered)}
      {@const goalVerdict = tip.verdict.goals[0]}
      <div
        class={[
          'border-surface-elevated-border bg-surface-elevated-bg pointer-events-none absolute top-2 z-10 w-60 rounded-xl border px-3 py-2.5 text-sm shadow-lg',
          center > width / 2
            ? '-translate-x-[calc(100%+16px)]'
            : 'translate-x-4',
        ]}
        style:left="{center}px"
      >
        <p class="text-fg-muted text-xs">{longDate(tip.date)}</p>
        {#if tip.inProgress}
          <p class="text-fg-tertiary text-xs">In progress, {now}</p>
        {/if}
        {#if !tip.tracked}
          <p class="text-fg-tertiary mt-1.5">No data yet on this day</p>
        {:else}
          {@render row('Visits', formatCount(tip.counts.visits), true)}
          {@render row(
            `Typical${tip.inProgress ? ` by ${now}` : ''}`,
            whole(tip.typical.visits),
          )}
          {#if tip.typical.visitsRange}
            {@render row(
              'Middle half',
              `${whole(tip.typical.visitsRange[0])}-${whole(tip.typical.visitsRange[1])}`,
            )}
          {/if}
          {#if tip.inProgress}
            {@render row('Typical full day', whole(tip.fullVisits))}
          {/if}
          {@render row('Verdict', verdictLabel(tip.verdict.visits.flag))}
          {#if goal && goalVerdict}
            <p class="mt-2.5 flex items-baseline justify-between gap-4">
              <span class="truncate font-mono text-xs">{goal}</span>
              <span class="font-medium whitespace-nowrap tabular-nums">
                {formatRate(goalVerdict.rate)}
                <span class="text-fg-muted text-xs font-normal">
                  {formatInterval(goalVerdict.interval)}
                </span>
              </span>
            </p>
            {@render row('Typical', formatRate(goalVerdict.typical))}
            {@render row('Verdict', verdictLabel(goalVerdict.flag))}
          {/if}
          <p class="text-fg-muted mt-2 text-xs">
            {tip.date === selected ? 'Open below' : 'Click to open this day'}
          </p>
        {/if}
      </div>
    {/if}
  </div>

  <div
    class="text-fg-tertiary flex flex-wrap gap-x-3.5 gap-y-1 px-3 pb-1 text-xs"
  >
    <span class="flex items-center gap-1.5">
      <svg width="8" height="8" aria-hidden="true">
        <rect width="8" height="8" rx="2" fill="var(--fg-faint)" />
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
          stroke="var(--fg-tertiary)"
          stroke-width="1.5"
        />
      </svg>
      Typical range, middle half of the same weekday
    </span>
    {#if goal}
      <span class="flex items-center gap-1.5">
        <svg width="8" height="12" aria-hidden="true">
          <line
            x1="4"
            x2="4"
            y1="1"
            y2="11"
            stroke="var(--fg-tertiary)"
            stroke-width="1.5"
            stroke-linecap="round"
          />
          <circle cx="4" cy="6" r="2.5" fill="var(--fg-default)" />
        </svg>
        <span>
          <span class="font-mono">{goal}</span>
          rate, 95% interval
        </span>
      </span>
    {/if}
  </div>
</section>

{#snippet average(label: string, value: string, mono = false)}
  <span class="flex items-baseline gap-1.5 whitespace-nowrap">
    <span class={['text-fg-muted', { 'font-mono': mono }]}>{label}</span>
    <span class="font-mono text-sm">{value}</span>
  </span>
{/snippet}

{#snippet averagesHint()}
  <p
    class="bg-surface-elevated-bg edge text-fg-secondary max-w-72 rounded-lg px-3 py-2 text-xs leading-5 whitespace-normal shadow"
  >
    Averages of the complete days shown. Each day is one sample: visits are
    never added up across days, since one person on two days is two visits.
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

{#snippet row(label: string, value: string, strong = false)}
  <p
    class={[
      'mt-1 flex justify-between gap-4',
      strong ? 'mt-1.5' : 'text-fg-tertiary',
    ]}
  >
    <span>{label}</span>
    <span class={['tabular-nums', { 'font-medium': strong }]}>{value}</span>
  </p>
{/snippet}
