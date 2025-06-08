<script lang="ts">
	import { page } from '$app/state';
	import { metricsState } from '$lib/clusters/projects/application/metrics.state.svelte.js';
	import { MetricGranularity } from '$lib/clusters/projects/domain/metric.js';
	import { logger } from '$lib/shared/logger/index.js';
	import { UserTier } from '../../../../../shared/types';
	import { userState } from '../../../../../shared/user/application/user.state.svelte';
	import DataTile from '../../../../common/ui/DataTile.svelte';
	import { getGraphReadyPoints } from './data.utils.js';
	import MetricBreakdownChart from './MetricBreakdownChart.svelte';

	const previewedMetricId = $derived(page.url.searchParams.get('metric_id'));

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

		return getGraphReadyPoints(
			metricsData,
			isPaidTier ? paidConfig : freeConfig,
		);
	});
</script>

{#snippet previewedMetricSubtitle()}
	<p class="mb-4 text-sm text-gray-500">
		Previewing {metricsState.getById(previewedMetricId)?.name} metric
	</p>
{/snippet}

<DataTile delayIn={0}>
	<h2 class="text-xl font-semibold">Minute data</h2>
	{@render previewedMetricSubtitle()}
	<MetricBreakdownChart
		data={minuteData}
		height={250}
		timeRange={isPaidTier ? 'large' : 'small'}
		isLoading={metricsState.metricDetailsLoading}
	/>
</DataTile>

<DataTile delayIn={50}>
	<h2 class="text-xl font-semibold">Hour data</h2>
	{@render previewedMetricSubtitle()}
	<MetricBreakdownChart
		data={hourData}
		height={250}
		format="hour"
		timeRange={isPaidTier ? 'large' : 'small'}
		isLoading={metricsState.metricDetailsLoading}
	/>
</DataTile>

<DataTile delayIn={100}>
	<h2 class="text-xl font-semibold">Day data</h2>
	{@render previewedMetricSubtitle()}
	<MetricBreakdownChart
		data={dayData}
		height={250}
		format="day"
		timeRange={isPaidTier ? 'large' : 'small'}
		isLoading={metricsState.metricDetailsLoading}
	/>
</DataTile>
