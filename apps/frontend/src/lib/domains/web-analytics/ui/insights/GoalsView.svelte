<script lang="ts">
  import { formatCount, formatPercent } from '../../domain/analytics-format';
  import { endsInProgress } from '../../domain/analytics-period';
  import type {
    AnalyticsChartLine,
    WebAnalyticsBreakdownRow,
    WebAnalyticsReport,
  } from '../../domain/web-analytics';
  import AnalyticsChart from '../AnalyticsChart.svelte';
  import { CARD_COLUMNS } from '../breakdown/dashboard-card';

  type Props = {
    report: WebAnalyticsReport | null;
    limit?: number;
    selected: string | null;
    onselect: (name: string) => void;
  };

  const { report, limit, selected, onselect }: Props = $props();

  const COLORS = [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)',
  ];

  const goals = $derived(report?.goals ?? []);
  const events = $derived(
    (report?.breakdowns.goals ?? []).filter(
      (event) => !goals.some((goal) => goal.name === event.name),
    ),
  );
  const shownGoals = $derived(limit ? goals.slice(0, limit) : goals);
  const shownEvents = $derived(
    limit ? events.slice(0, Math.max(0, limit - shownGoals.length)) : events,
  );
  const lines = $derived<AnalyticsChartLine[]>(
    (report?.goalSeries ?? []).map((goal, index) => ({
      label: goal.name,
      values: goal.counts,
      color: COLORS[index % COLORS.length],
    })),
  );
  const goalPeak = $derived(Math.max(1, ...goals.map((goal) => goal.visitors)));
  const eventPeak = $derived(
    Math.max(1, ...events.map((event) => event.visitors)),
  );

  function colorOf(name: string): string | undefined {
    return lines.find((line) => line.label === name)?.color;
  }
</script>

{#if !report}
  <div class="bg-surface-150-bg h-48 rounded-xl"></div>
{:else if !goals.length && !events.length}
  <div
    class="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-6 text-center"
  >
    <p class="font-medium">No goals in this period</p>
    <p class="text-fg-tertiary text-sm">
      Track your first goal from your website:
    </p>
    <code
      class="bg-surface-150-bg rounded-md px-2 py-1 font-mono text-xs whitespace-nowrap"
    >
      window.logdash?.track('signup_completed')
    </code>
  </div>
{:else}
  {#if !limit && lines.length}
    <AnalyticsChart
      times={report.series.map((point) => point.time)}
      {lines}
      granularity={report.granularity}
      partial={endsInProgress(report.to)}
      label="Goal completions per {report.granularity}"
      class="mb-4 h-48 sm:h-56"
    />
  {/if}
  <div class={CARD_COLUMNS}>
    <span>Goal</span>
    <span class="flex gap-6">
      <span class="flex w-16 justify-end">Completions</span>
      <span class="w-16 text-right">Conversion</span>
    </span>
  </div>
  {#if shownGoals.length}
    <ul class="flex flex-col gap-0.5">
      {#each shownGoals as goal (goal.name)}
        {@render row(goal, goalPeak, true)}
      {/each}
    </ul>
  {/if}
  {#if shownEvents.length}
    <p class="text-fg-muted mt-1.5 flex h-6 items-center px-3 text-xs">
      {goals.length ? 'Other events' : 'Events'}
    </p>
    <ul class="flex flex-col gap-0.5">
      {#each shownEvents as event (event.name)}
        {@render row(event, eventPeak, false)}
      {/each}
    </ul>
  {/if}
{/if}

{#snippet row(item: WebAnalyticsBreakdownRow, peak: number, goal: boolean)}
  {@const color = goal && !limit ? colorOf(item.name) : undefined}
  <li>
    <button
      type="button"
      class={[
        'group focus-visible:outline-brand relative flex h-8 w-full cursor-pointer items-center gap-3 rounded-lg px-3 text-left text-sm focus-visible:outline-2',
        { 'bg-surface-25-selected-bg': item.name === selected },
        { 'text-fg-tertiary': !goal },
      ]}
      aria-pressed={item.name === selected}
      title={item.name === selected
        ? 'Back to traffic'
        : `Show the trend of ${item.name}`}
      onclick={() => onselect(item.name)}
    >
      <span
        class="bg-surface-150-bg group-hover:bg-surface-150-hover-bg absolute inset-y-0 left-0 rounded-lg"
        style:width="{Math.max(1.5, (item.visitors / peak) * 100)}%"
        aria-hidden="true"
      ></span>
      <span class="relative flex min-w-0 flex-1 items-center gap-2">
        {#if color}
          <span
            class="size-2 shrink-0 rounded-full"
            style:background-color={color}
          ></span>
        {/if}
        <span class="truncate font-mono text-[13px]">{item.name}</span>
      </span>
      <span class="relative flex shrink-0 gap-6 tabular-nums">
        <span class="w-16 text-right font-medium">
          {formatCount(item.count)}
        </span>
        <span class="text-fg-tertiary w-16 text-right">
          {#if goal && report}
            {formatPercent(
              (item.visitors / Math.max(1, report.summary.visitors)) * 100,
            )}
          {/if}
        </span>
      </span>
    </button>
  </li>
{/snippet}
