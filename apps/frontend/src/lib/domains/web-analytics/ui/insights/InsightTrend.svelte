<script lang="ts">
  import { formatCount } from '../../domain/analytics-format';
  import type {
    AnalyticsChartLine,
    WebAnalyticsInsightBucket,
    WebAnalyticsInsightEvent,
    WebAnalyticsInsightSeries,
  } from '../../domain/web-analytics';
  import {
    commonPrefix,
    filterLabel,
  } from '../../domain/web-analytics-insight';
  import AnalyticsChart from '../AnalyticsChart.svelte';
  import InsightEventName from './InsightEventName.svelte';

  type Props = {
    times: number[];
    series: WebAnalyticsInsightSeries[];
    events: WebAnalyticsInsightEvent[];
    bucket: WebAnalyticsInsightBucket;
    people: boolean;
    partial: boolean;
    label: string;
  };

  const { times, series, events, bucket, people, partial, label }: Props =
    $props();

  const CURRENT: Record<WebAnalyticsInsightBucket, string> = {
    day: 'today',
    week: 'this week',
    month: 'this month',
  };

  const COLORS = [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)',
  ];

  const prefix = $derived(commonPrefix(series.map((entry) => entry.name)));
  const mixed = $derived(series.some((entry) => entry.bucket !== bucket));
  const labels = $derived(
    series.map(
      (entry, index) =>
        entry.label ??
        [entry.name, ...(events[index]?.filters ?? []).map(filterLabel)].join(
          ', ',
        ),
    ),
  );
  const lines = $derived<AnalyticsChartLine[]>(
    series.map((entry, index) => ({
      label:
        labels.indexOf(labels[index]) === index
          ? labels[index]
          : `${labels[index]} (${index + 1})`,
      values: entry.counts,
      color: COLORS[index % COLORS.length],
      area: series.length === 1,
      bucket: entry.bucket === bucket ? undefined : entry.bucket,
    })),
  );
</script>

<AnalyticsChart {times} {lines} granularity={bucket} {partial} {label} />

<ul class="flex flex-col gap-0.5">
  {#each series as entry, index (index)}
    <li class="flex min-h-8 items-center gap-2 px-3 py-1 text-sm">
      <span
        class="size-2 shrink-0 rounded-full"
        style:background-color={COLORS[index % COLORS.length]}
      ></span>
      <span class="min-w-0 flex-1">
        <InsightEventName
          name={entry.name}
          {prefix}
          filters={events[index]?.filters ?? []}
          label={entry.label}
        />
      </span>
      {#if people}
        <span class="text-fg-muted text-xs">{CURRENT[entry.bucket]}</span>
      {:else if mixed}
        <span class="text-fg-muted text-xs">per {entry.bucket}</span>
      {/if}
      <span class="font-medium tabular-nums">
        {formatCount(people ? (entry.counts.at(-1) ?? 0) : entry.total)}
      </span>
    </li>
  {/each}
</ul>

{#if people && series.every((entry) => !entry.total)}
  <p class="text-fg-muted px-3 text-xs">
    No people yet. An event counts a person only when the app sends a user ID.
  </p>
{/if}
