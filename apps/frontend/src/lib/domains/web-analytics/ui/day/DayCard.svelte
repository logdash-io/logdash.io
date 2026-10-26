<script lang="ts">
  import { DateTime } from 'luxon';
  import { formatRate, whole, type Verdict } from '../../domain/day-analytics';
  import type { WebAnalyticsSourceSeries } from '../../domain/web-analytics';
  import DayTile from './DayTile.svelte';
  import HourChart from './HourChart.svelte';

  type Props = {
    date: string;
    inProgress: boolean;
    now: string;
    headline: string | null;
    verdict: Verdict | null;
    goals: string[];
    hours: number[] | null;
    typicalHours: number[] | null;
    goalHours: number[][];
    sources: WebAnalyticsSourceSeries[];
    spot: string | null;
    pinned: string | null;
    onhover: (name: string | null) => void;
    onpin: (name: string) => void;
  };

  const {
    date,
    inProgress,
    now,
    headline,
    verdict,
    goals,
    hours,
    typicalHours,
    goalHours,
    sources,
    spot,
    pinned,
    onhover,
    onpin,
  }: Props = $props();

  const day = $derived(DateTime.fromISO(date));
  const title = $derived(
    day.toFormat(
      day.year === DateTime.local().year ? 'cccc d LLLL' : 'cccc d LLLL yyyy',
    ),
  );
  const weekdays = $derived(`${day.toFormat('cccc')}s`);
  const by = $derived(inProgress ? ` by ${now}` : '');
  const shownGoals = $derived(goals.slice(0, verdict?.goals.length ?? 0));
  const legend = $derived(
    [...sources]
      .sort(
        (a, b) =>
          b.visits.reduce((sum, value) => sum + value, 0) -
          a.visits.reduce((sum, value) => sum + value, 0),
      )
      .slice(0, 6),
  );
</script>

<section
  class="bg-surface-25-bg @container flex min-w-0 flex-col gap-2 rounded-2xl p-2 [--chart-surface:var(--surface-25-bg)]"
  aria-label={title}
>
  <header class="flex flex-col gap-1 px-3 pt-1.5">
    <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
      <h2 class="text-[15px] font-medium">{title}</h2>
      {#if inProgress}
        <span class="text-fg-tertiary flex items-center gap-1.5 text-xs">
          <span class="relative flex size-1.5">
            <span
              class="bg-success absolute inline-flex size-full rounded-full motion-safe:animate-ping"
            ></span>
            <span
              class="bg-success relative inline-flex size-1.5 rounded-full"
            ></span>
          </span>
          In progress, {now}
        </span>
      {/if}
    </div>
    {#if headline}
      <p
        class="text-fg-secondary max-w-4xl text-sm leading-6"
        aria-live="polite"
      >
        {headline}
      </p>
    {:else}
      <span
        class="bg-surface-150-bg mt-1 block h-4 w-80 max-w-full rounded-md"
      ></span>
    {/if}
  </header>

  <dl
    class="grid grid-cols-2 gap-2 @3xl:grid-cols-[repeat(auto-fit,minmax(11rem,1fr))]"
  >
    {#if verdict}
      <DayTile
        label="Visits"
        hint="One visitor on one day. Anonymous visitors get a new ID every day, so the same person on two days is two visits."
        verdict={verdict.visits}
        typical={verdict.visits.typical === null
          ? 'No typical day yet'
          : `Typical ${whole(verdict.visits.typical)}${by}`}
        {by}
        {weekdays}
        loading={false}
      />
      <DayTile
        label="Stayed"
        hint="Visits with 2 or more pages, a goal, or 10 seconds or more."
        verdict={verdict.stayed}
        typical={verdict.stayed.typical === null
          ? 'No typical day yet'
          : `Typical ${formatRate(verdict.stayed.typical)}`}
        {by}
        {weekdays}
        reached="stayed"
        loading={false}
      />
      {#each shownGoals as goal, index (goal)}
        <DayTile
          label={goal}
          hint="{index === 0
            ? 'Primary goal. '
            : ''}People who did {goal} on this day, on your website or in your apps. Each goal is counted on its own, not as a step after the one before."
          verdict={verdict.goals[index]}
          typical={verdict.goals[index].typical === null
            ? 'No typical day yet'
            : `Typical ${whole(verdict.goals[index].typical)}${by}`}
          {by}
          {weekdays}
          unit="people"
          goal
          loading={false}
        />
      {/each}
      {#if !goals.length}
        <div class="col-span-2 flex min-w-0 flex-col gap-1.5 rounded-lg p-3">
          <dt class="text-fg-muted text-xs">Goal</dt>
          <dd class="text-fg-tertiary text-sm leading-6">
            Track a custom event, such as a signup, to see how many visits
            convert and when.
          </dd>
          <dd>
            <code
              class="bg-surface-150-bg rounded-md px-2 py-1 font-mono text-xs whitespace-nowrap"
            >
              window.logdash?.track('signup')
            </code>
          </dd>
        </div>
      {/if}
    {:else}
      {#each [0, 1, 2, 3] as tile (tile)}
        <DayTile
          label=""
          hint=""
          verdict={{ value: 0, typical: null, flag: 0 }}
          typical=""
          {by}
          {weekdays}
          loading
        />
      {/each}
    {/if}
  </dl>

  <div
    class="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 px-3 pt-2"
  >
    <h3 class="text-[13px] font-medium">Visits per hour</h3>
    <div
      class="text-fg-tertiary flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs"
    >
      <span class="flex items-center gap-1.5">
        <span class="bg-surface-inverse-bg h-0.5 w-3.5 rounded-full"></span>
        Visits
      </span>
      <span class="flex items-center gap-1.5">
        <svg width="14" height="2" aria-hidden="true">
          <line
            x2="14"
            y1="1"
            y2="1"
            stroke="var(--fg-faint)"
            stroke-width="1.5"
            stroke-dasharray="3 2"
          />
        </svg>
        Typical day
      </span>
      {#each shownGoals as goal, index (goal)}
        <span class="flex items-center gap-1.5">
          <svg width="8" height="8" aria-hidden="true">
            <circle
              cx="4"
              cy="4"
              r={index ? 3.25 : 4}
              fill={index ? 'none' : 'var(--fg-default)'}
              stroke={index ? 'var(--fg-tertiary)' : 'none'}
              stroke-width="1.5"
            />
          </svg>
          <span class="font-mono">{goal}</span>
        </span>
      {/each}
      {#if legend.length}
        <span
          class="edge-l flex flex-wrap items-center gap-0.5 pl-2 max-sm:basis-full max-sm:pl-0 max-sm:shadow-none"
          role="group"
          aria-label="Show one source in the chart"
        >
          {#each legend as source (source.name)}
            <button
              type="button"
              class={[
                'transition-ink focus-visible:outline-brand h-5 max-w-36 cursor-pointer truncate rounded-md px-1.5 focus-visible:outline-2',
                source.name === pinned
                  ? 'bg-surface-150-bg text-fg-default'
                  : source.name === spot
                    ? 'text-fg-default'
                    : 'text-fg-muted hover:text-fg-default',
              ]}
              aria-pressed={source.name === pinned}
              onpointerenter={() => onhover(source.name)}
              onpointerleave={() => onhover(null)}
              onfocus={() => onhover(source.name)}
              onblur={() => onhover(null)}
              onclick={() => onpin(source.name)}
            >
              {source.name}
            </button>
          {/each}
        </span>
      {/if}
    </div>
  </div>

  <div class="pt-1 pr-1 pb-1.5 pl-3">
    {#if hours}
      <HourChart
        {date}
        {hours}
        typical={typicalHours}
        lanes={shownGoals.map((goal, index) => ({
          name: goal,
          hours: goalHours[index] ?? [],
        }))}
        {sources}
        {spot}
        current={inProgress ? Number(now.slice(0, 2)) : null}
        {now}
      />
    {:else}
      <div class="bg-surface-150-bg h-62 rounded-xl"></div>
    {/if}
  </div>
</section>
