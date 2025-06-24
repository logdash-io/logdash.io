<script lang="ts">
  import { page } from '$app/state';
  import { metricsState } from '$lib/clusters/projects/application/metrics.state.svelte.js';
  import { MetricGranularity } from '$lib/clusters/projects/domain/metric.js';
  import { logger } from '$lib/shared/logger/index.js';
  import { userState } from '$lib/shared/user/application/user.state.svelte.js';
  import DataTile from '../tiles/DataTile.svelte';
  import { ChartOptions, ChartTitles, ChartType } from './chart-types.js';
  import { getGraphReadyPoints } from './data.utils.js';
  import MetricBreakdownChart from './MetricBreakdownChart.svelte';
  import TimeRangeSelector from './TimeRangeSelector.svelte';

  const previewedMetricId = $derived(page.url.searchParams.get('metric_id'));

  let minuteDataTimeRange: string = $state(
    ChartOptions[ChartType.MINUTE].SMALL,
  );
  let hourDataTimeRange: string = $state(ChartOptions[ChartType.HOUR].SMALL);
  let dayDataTimeRange: string = $state(ChartOptions[ChartType.DAY].SMALL);

  $effect(() => {
    const projectId = page.url.searchParams.get('project_id');

    if (!projectId || !previewedMetricId) {
      logger.warn(
        'MetricDetails: Synchronization failed due to missing projectId or metricId',
      );
      return;
    }

    minuteDataTimeRange;
    hourDataTimeRange;
    dayDataTimeRange;

    metricsState.previewMetric(projectId, previewedMetricId);
  });

  const { minuteData, hourData, dayData } = $derived.by(() => {
    const minuteData = metricsState.metricsByMetricRegisterId(
      page.url.searchParams.get('metric_id'),
      MetricGranularity.MINUTE,
    );
    const hourData = metricsState.metricsByMetricRegisterId(
      page.url.searchParams.get('metric_id'),
      MetricGranularity.HOUR,
    );
    const dayData = metricsState.metricsByMetricRegisterId(
      page.url.searchParams.get('metric_id'),
      MetricGranularity.DAY,
    );
    const allTimeData = metricsState.metricsByMetricRegisterId(
      page.url.searchParams.get('metric_id'),
      MetricGranularity.ALL_TIME,
    );
    const metricsData = [
      ...minuteData,
      ...hourData,
      ...dayData,
      ...allTimeData,
    ];

    if (!metricsData.length || !allTimeData.length) {
      return {
        minuteData: [],
        hourData: [],
        dayData: [],
      };
    }

    const freeConfig = {
      minute: 60,
      hour: 12,
      day: 7,
    };

    const paidConfig = {
      minute: 60 * 12,
      hour: 12 * 24,
      day: 30,
    };

    const compiledConfig = {
      minute:
        userState.isPaid &&
        minuteDataTimeRange === ChartOptions[ChartType.MINUTE].LARGE
          ? paidConfig.minute
          : freeConfig.minute,
      hour:
        userState.isPaid &&
        hourDataTimeRange === ChartOptions[ChartType.HOUR].LARGE
          ? paidConfig.hour
          : freeConfig.hour,
      day:
        userState.isPaid &&
        dayDataTimeRange === ChartOptions[ChartType.DAY].LARGE
          ? paidConfig.day
          : freeConfig.day,
    };

    console.log(minuteDataTimeRange, hourDataTimeRange, dayDataTimeRange);
    console.log('compiledConfig', compiledConfig);


    const graphReadyPoints = getGraphReadyPoints(metricsData, compiledConfig);
    return graphReadyPoints;
  });
</script>

{#snippet previewedMetricSubtitle()}
  <p class="mb-4 text-sm text-gray-500">
    Previewing {metricsState.getById(previewedMetricId)?.name} metric
  </p>
{/snippet}

<DataTile delayIn={0}>
  <TimeRangeSelector
    canSwitchTabs={!userState.isPaid}
    currentRange={minuteDataTimeRange}
    largeOption={ChartOptions[ChartType.MINUTE].LARGE}
    onRangeChange={(range) => (minuteDataTimeRange = range)}
    smallOption={ChartOptions[ChartType.MINUTE].SMALL}
    title={ChartTitles[ChartType.MINUTE]}
  />

  {@render previewedMetricSubtitle()}
  <MetricBreakdownChart
    data={minuteData}
    height={250}
    isLoading={metricsState.metricDetailsLoading}
    timeRange={minuteDataTimeRange === ChartOptions[ChartType.MINUTE].LARGE
      ? 'large'
      : 'small'}
  />
</DataTile>

<DataTile delayIn={50}>
  <TimeRangeSelector
    canSwitchTabs={!userState.isPaid}
    currentRange={hourDataTimeRange}
    largeOption={ChartOptions[ChartType.HOUR].LARGE}
    onRangeChange={(range) => (hourDataTimeRange = range)}
    smallOption={ChartOptions[ChartType.HOUR].SMALL}
    title={ChartTitles[ChartType.HOUR]}
  />

  {@render previewedMetricSubtitle()}
  <MetricBreakdownChart
    data={hourData}
    format="hour"
    height={250}
    isLoading={metricsState.metricDetailsLoading}
    timeRange={hourDataTimeRange === ChartOptions[ChartType.HOUR].LARGE
      ? 'large'
      : 'small'}
  />
</DataTile>

<DataTile delayIn={100}>
  <TimeRangeSelector
    canSwitchTabs={!userState.isPaid}
    currentRange={dayDataTimeRange}
    largeOption={ChartOptions[ChartType.DAY].LARGE}
    onRangeChange={(range) => (dayDataTimeRange = range)}
    smallOption={ChartOptions[ChartType.DAY].SMALL}
    title={ChartTitles[ChartType.DAY]}
  />

  {@render previewedMetricSubtitle()}
  <MetricBreakdownChart
    data={dayData}
    format="day"
    height={250}
    isLoading={metricsState.metricDetailsLoading}
    timeRange={dayDataTimeRange === ChartOptions[ChartType.DAY].LARGE
      ? 'large'
      : 'small'}
  />
</DataTile>
