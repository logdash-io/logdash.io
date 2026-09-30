<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { metricsState } from '$lib/domains/app/projects/application/metrics.state.svelte.js';
  import { MetricGranularity } from '$lib/domains/app/projects/domain/metric.js';
  import { getGraphReadyPoints } from '$lib/domains/app/projects/ui/ProjectView/MetricDetails/data.utils.js';
  import MetricBreakdownChart from '$lib/domains/app/projects/ui/ProjectView/MetricDetails/MetricBreakdownChart.svelte';
  import TrashIcon from '$lib/domains/shared/icons/TrashIcon.svelte';
  import IconButton from '$lib/domains/shared/ui/components/IconButton.svelte';
  import PaneHeader from '$lib/domains/shared/ui/components/PaneHeader.svelte';
  import TimeRangeSelector from '$lib/domains/shared/ui/components/TimeRangeSelector.svelte';
  import { upgradeState } from '$lib/domains/shared/upgrade/upgrade.state.svelte.js';
  import { userState } from '$lib/domains/shared/user/application/user.state.svelte.js';

  type Range = {
    label: string;
    granularity:
      | MetricGranularity.MINUTE
      | MetricGranularity.HOUR
      | MetricGranularity.DAY;
    points: number;
    pro: boolean;
  };

  const RANGES: Range[] = [
    {
      label: '1h',
      granularity: MetricGranularity.MINUTE,
      points: 60,
      pro: false,
    },
    {
      label: '12h',
      granularity: MetricGranularity.MINUTE,
      points: 720,
      pro: true,
    },
    {
      label: '24h',
      granularity: MetricGranularity.HOUR,
      points: 24,
      pro: false,
    },
    { label: '7d', granularity: MetricGranularity.DAY, points: 7, pro: false },
    { label: '30d', granularity: MetricGranularity.DAY, points: 30, pro: true },
  ];
  const CHART_INSET_PX = 32;

  const integer = new Intl.NumberFormat('en-US');
  const decimal = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

  const clusterId = $derived(page.params.cluster_id);
  const projectId = $derived(page.params.project_id);
  const metricId = $derived(page.params.metric_id);
  const metric = $derived(
    metricId ? metricsState.getById(metricId) : undefined,
  );
  const isPaid = $derived(userState.isPaid);

  let rangeLabel = $state(RANGES[0].label);
  let chartHeight = $state(0);

  const range = $derived(
    RANGES.find(({ label }) => label === rangeLabel) ?? RANGES[0],
  );
  const options = $derived(
    RANGES.map(({ label, pro }) => ({
      value: label,
      label,
      locked: pro && !isPaid,
    })),
  );

  const data = $derived.by(() => {
    if (!metricId) {
      return [];
    }

    const allTime = metricsState.metricsByMetricRegisterId(
      metricId,
      MetricGranularity.ALL_TIME,
    );

    if (allTime.length === 0) {
      return [];
    }

    const points = getGraphReadyPoints(
      [
        ...metricsState.metricsByMetricRegisterId(metricId, range.granularity),
        ...allTime,
      ],
      { minute: 1, hour: 1, day: 1, [range.granularity]: range.points },
    );

    return {
      [MetricGranularity.MINUTE]: points.minuteData,
      [MetricGranularity.HOUR]: points.hourData,
      [MetricGranularity.DAY]: points.dayData,
    }[range.granularity];
  });

  $effect(() => {
    if (!projectId || !metricId) {
      return;
    }

    void rangeLabel;

    metricsState.previewMetric(projectId, metricId);
  });

  function onRangeSelect(label: string): void {
    const selected = RANGES.find((candidate) => candidate.label === label);

    if (selected?.pro && !isPaid) {
      upgradeState.openModal();
      return;
    }

    rangeLabel = label;
  }

  function onDelete(): void {
    if (!clusterId || !projectId || !metric) {
      return;
    }

    if (!confirm(`Delete the ${metric.name} metric?`)) {
      return;
    }

    void metricsState.delete(projectId, metric.id);
    void goto(
      resolve('/app/domains/[cluster_id]/[project_id]/metrics', {
        cluster_id: clusterId,
        project_id: projectId,
      }),
    );
  }

  function format(value: number): string {
    return Number.isInteger(value)
      ? integer.format(value)
      : decimal.format(value);
  }
</script>

<div class="flex min-h-0 flex-1 flex-col">
  <PaneHeader title={metric?.name ?? 'Metric'}>
    <TimeRangeSelector
      {options}
      selected={rangeLabel}
      onSelect={onRangeSelect}
    />

    {#if metric}
      <span class="bg-hairline h-4 w-px"></span>
      <IconButton
        label="Delete metric"
        danger
        class="-mr-1.5"
        data-posthog-id="delete-metric-button"
        onclick={onDelete}
      >
        <TrashIcon class="size-4" />
      </IconButton>
    {/if}
  </PaneHeader>

  <div class="flex flex-col gap-0.5 px-4 pt-4">
    <span class="text-neutral-500 text-xs">Now</span>
    <span class="font-figure h-8 truncate text-2xl">
      {metric ? format(metric.value) : ''}
    </span>
  </div>

  <div class="relative min-h-72 flex-1" bind:clientHeight={chartHeight}>
    <div class="absolute inset-0 p-4">
      {#if chartHeight > 0}
        <MetricBreakdownChart
          {data}
          format={range.granularity}
          height={chartHeight - CHART_INSET_PX}
          isLoading={metricsState.metricDetailsLoading && data.length === 0}
          failed={metricsState.metricDetailsFailed && data.length === 0}
          timeRange={range.pro ? 'large' : 'small'}
        />
      {/if}
    </div>
  </div>
</div>
