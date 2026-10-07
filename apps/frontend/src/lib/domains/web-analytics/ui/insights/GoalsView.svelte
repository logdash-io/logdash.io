<script lang="ts">
  import { resolve } from '$app/paths';
  import ChevronRightIcon from '$lib/domains/shared/icons/ChevronRightIcon.svelte';
  import { formatCount, formatPercent } from '../../domain/analytics-format';
  import { endsInProgress } from '../../domain/analytics-period';
  import type {
    AnalyticsChartLine,
    WebAnalyticsBreakdownRow,
    WebAnalyticsFilter,
    WebAnalyticsReport,
  } from '../../domain/web-analytics';
  import AnalyticsChart from '../AnalyticsChart.svelte';
  import { CARD_COLUMNS } from '../breakdown/dashboard-card';

  type Props = {
    report: WebAnalyticsReport | null;
    limit?: number;
    eventPath: (name: string) => `/app/domains/${string}`;
    onfilter: (filter: WebAnalyticsFilter) => void;
  };

  const { report, limit, eventPath, onfilter }: Props = $props();

  const COLORS = [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)',
  ];

  const goals = $derived(report?.breakdowns.goals ?? []);
  const visible = $derived(limit ? goals.slice(0, limit) : goals);
  const lines = $derived<AnalyticsChartLine[]>(
    (report?.goalSeries ?? []).map((goal, index) => ({
      label: goal.name,
      values: goal.counts,
      color: COLORS[index % COLORS.length],
    })),
  );
  const peak = $derived(Math.max(1, ...goals.map((goal) => goal.count)));

  function colorOf(name: string): string | undefined {
    return lines.find((line) => line.label === name)?.color;
  }

  function onSelect(goal: WebAnalyticsBreakdownRow): void {
    onfilter({ dimension: 'goal', value: goal.name });
  }
</script>

{#if !report}
  <div class="bg-surface-150-bg h-48 rounded-xl"></div>
{:else if !goals.length}
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
  {#if !limit}
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
    <span class="flex gap-6 pr-8.5">
      <span class="w-16 text-right">Completions</span>
      <span class="w-16 text-right">Conversion</span>
    </span>
  </div>
  <ul class="flex flex-col gap-0.5">
    {#each visible as goal (goal.name)}
      {@const color = limit ? undefined : colorOf(goal.name)}
      <li class="flex items-center gap-0.5">
        <button
          type="button"
          class="group focus-visible:outline-brand relative flex h-8 min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg px-3 text-left text-sm focus-visible:outline-2"
          title="Filter by visitors who completed {goal.name}"
          onclick={() => onSelect(goal)}
        >
          <span
            class="bg-surface-150-bg group-hover:bg-surface-150-hover-bg absolute inset-y-0 left-0 rounded-lg"
            style:width="{Math.max(1.5, (goal.count / peak) * 100)}%"
            aria-hidden="true"
          ></span>
          <span class="relative flex min-w-0 flex-1 items-center gap-2">
            {#if color}
              <span
                class="size-2 shrink-0 rounded-full"
                style:background-color={color}
              ></span>
            {/if}
            <span class="truncate font-mono text-[13px]">{goal.name}</span>
          </span>
          <span class="relative flex shrink-0 gap-6 tabular-nums">
            <span class="w-16 text-right font-medium">
              {formatCount(goal.count)}
            </span>
            <span class="text-fg-tertiary w-16 text-right">
              {formatPercent(
                (goal.visitors / Math.max(1, report.summary.visitors)) * 100,
              )}
            </span>
          </span>
        </button>
        <a
          href={resolve(eventPath(goal.name))}
          class="hover:bg-surface-150-bg hover:text-fg-default transition-ink focus-visible:outline-brand flex size-8 shrink-0 items-center justify-center rounded-lg text-fg-muted focus-visible:outline-2"
          aria-label="Open {goal.name}"
          title="Trend and properties of {goal.name}"
        >
          <ChevronRightIcon class="size-3.5" />
        </a>
      </li>
    {/each}
  </ul>
{/if}
