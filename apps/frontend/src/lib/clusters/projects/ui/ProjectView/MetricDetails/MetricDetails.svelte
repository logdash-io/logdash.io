<script lang="ts">
	import { page } from '$app/state';
	import { metricsState } from '$lib/clusters/projects/application/metrics.state.svelte.js';
	import { MetricGranularity } from '$lib/clusters/projects/domain/metric.js';
	import { logger } from '$lib/shared/logger/index.js';
	import { UserTier } from '../../../../../shared/types';
	import { userState } from '../../../../../shared/user/application/user.state.svelte';
	import DataTile from '../tiles/DataTile.svelte';
	import { getGraphReadyPoints } from './data.utils.js';
	import MetricBreakdownChart from './MetricBreakdownChart.svelte';
	import TimeRangeSelector from './TimeRangeSelector.svelte';
	import { ChartType, ChartOptions, ChartTitles } from './chart-types.js';

	const previewedMetricId = $derived(page.url.searchParams.get('metric_id'));

	let minuteDataTimeRange: string = $state(ChartOptions[ChartType.MINUTE].SMALL);
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

		metricsState.previewMetric(projectId, previewedMetricId);
	});

	const tier: UserTier = userState.tier;
	const isPaidTier = tier !== UserTier.FREE;

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
			minute: (isPaidTier && minuteDataTimeRange === ChartOptions[ChartType.MINUTE].LARGE) ? paidConfig.minute : freeConfig.minute,
			hour: (isPaidTier && hourDataTimeRange === ChartOptions[ChartType.HOUR].LARGE) ? paidConfig.hour : freeConfig.hour,
			day: (isPaidTier && dayDataTimeRange === ChartOptions[ChartType.DAY].LARGE) ? paidConfig.day : freeConfig.day,
		}

		return getGraphReadyPoints(
			metricsData,
			compiledConfig,
		);
	});
</script>

{#snippet previewedMetricSubtitle()}
	<p class="mb-4 text-sm text-gray-500">
		Previewing {metricsState.getById(previewedMetricId)?.name} metric
	</p>
{/snippet}

<DataTile delayIn={0}>
	<TimeRangeSelector
		title={ChartTitles[ChartType.MINUTE]}
		currentRange={minuteDataTimeRange}
		smallOption={ChartOptions[ChartType.MINUTE].SMALL}
		largeOption={ChartOptions[ChartType.MINUTE].LARGE}
		{isPaidTier}
		onRangeChange={(range) => minuteDataTimeRange = range}
	/>
	
	{@render previewedMetricSubtitle()}
	<MetricBreakdownChart
		data={minuteData}
		height={250}
		timeRange={minuteDataTimeRange === ChartOptions[ChartType.MINUTE].LARGE ? 'large' : 'small'}
		isLoading={metricsState.metricDetailsLoading}
	/>
</DataTile>

<DataTile delayIn={50}>
	<TimeRangeSelector
		title={ChartTitles[ChartType.HOUR]}
		currentRange={hourDataTimeRange}
		smallOption={ChartOptions[ChartType.HOUR].SMALL}
		largeOption={ChartOptions[ChartType.HOUR].LARGE}
		{isPaidTier}
		onRangeChange={(range) => hourDataTimeRange = range}
	/>
	
	{@render previewedMetricSubtitle()}
	<MetricBreakdownChart
		data={hourData}
		height={250}
		format="hour"
		timeRange={hourDataTimeRange === ChartOptions[ChartType.HOUR].LARGE ? 'large' : 'small'}
		isLoading={metricsState.metricDetailsLoading}
	/>
</DataTile>

<DataTile delayIn={100}>
	<TimeRangeSelector
		title={ChartTitles[ChartType.DAY]}
		currentRange={dayDataTimeRange}
		smallOption={ChartOptions[ChartType.DAY].SMALL}
		largeOption={ChartOptions[ChartType.DAY].LARGE}
		{isPaidTier}
		onRangeChange={(range) => dayDataTimeRange = range}
	/>
	
	{@render previewedMetricSubtitle()}
	<MetricBreakdownChart
		data={dayData}
		height={250}
		format="day"
		timeRange={dayDataTimeRange === ChartOptions[ChartType.DAY].LARGE ? 'large' : 'small'}
		isLoading={metricsState.metricDetailsLoading}
	/>
</DataTile>
