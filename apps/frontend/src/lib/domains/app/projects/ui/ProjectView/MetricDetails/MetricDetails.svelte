<script lang="ts">
  import { confirmDialog } from '$lib/domains/shared/ui/confirm/confirm.state.svelte.js';
  import { topBarState } from '$lib/domains/app/clusters/application/top-bar.state.svelte.js';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { metricsState } from '$lib/domains/app/projects/application/metrics.state.svelte.js';
  import { MetricGranularity } from '$lib/domains/app/projects/domain/metric.js';
  import { getGraphReadyPoints } from '$lib/domains/app/projects/ui/ProjectView/MetricDetails/data.utils.js';
  import MetricBreakdownChart from '$lib/domains/app/projects/ui/ProjectView/MetricDetails/MetricBreakdownChart.svelte';
  import TrashIcon from '$lib/domains/shared/icons/TrashIcon.svelte';
  import IconButton from '$lib/domains/shared/ui/components/IconButton.svelte';
  import TimeRangeSelector from '$lib/domains/shared/ui/components/TimeRangeSelector.svelte';
  import Well from '$lib/domains/shared/ui/components/Well.svelte';
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

  $effect(() => topBarState.show(toolbar));

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

  async function onDelete(): Promise<void> {
    if (!clusterId || !projectId || !metric) {
      return;
    }

    const confirmed = await confirmDialog.ask({
      title: 'Delete metric',
      description: `${metric.name} and its history will be deleted. This cannot be undone.`,
      confirmLabel: 'Delete metric',
    });

    if (!confirmed) {
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

<Well
  label={metric?.name ?? 'Metric'}
  title={metric?.name ?? 'Metric'}
  class="min-h-0 flex-1 [--chart-surface:var(--surface-25-bg)]"
  actions={metric ? deleteAction : undefined}
>
  <div class="flex min-w-0 flex-col gap-1.5 p-3">
    <span class="text-fg-muted text-xs">Now</span>
    <span class="h-8 truncate font-mono text-2xl tabular-nums">
      {metric ? format(metric.value) : ''}
    </span>
  </div>

  <div class="relative min-h-72 flex-1">
    <div class="absolute inset-0 pt-2 pb-1.5 pl-3">
      <MetricBreakdownChart
        {data}
        label={metric?.name ?? 'Metric'}
        format={range.granularity}
        isLoading={metricsState.metricDetailsLoading && data.length === 0}
        failed={metricsState.metricDetailsFailed && data.length === 0}
        timeRange={range.pro ? 'large' : 'small'}
      />
    </div>
  </div>
</Well>

{#snippet toolbar()}
  <TimeRangeSelector
    {options}
    selected={rangeLabel}
    label="Metric range"
    onSelect={onRangeSelect}
  />
{/snippet}

{#snippet deleteAction()}
  <IconButton well danger label="Delete metric" onclick={onDelete}>
    <TrashIcon class="size-3.5" />
  </IconButton>
{/snippet}
