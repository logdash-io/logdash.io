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

	const HourDataChartOptions = {
		Small: '24h',
		Large: '7 days',
	} as const;

	const previewedMetricId = $derived(page.url.searchParams.get('metric_id'));

	let hourDataTimeRange: typeof HourDataChartOptions[keyof typeof HourDataChartOptions] = $state(HourDataChartOptions.Small);

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
			minute: isPaidTier ? paidConfig.minute : freeConfig.minute,
			hour: (isPaidTier && hourDataTimeRange === HourDataChartOptions.Large) ? paidConfig.hour : freeConfig.hour,
			day: isPaidTier ? paidConfig.day : freeConfig.day,
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
	<div class="flex justify-between items-center mb-4">
		<h2 class="text-xl font-semibold">Hour data</h2>
		<div
			role="tablist"
			class="tabs tabs-box tabs-sm bg-base-100/70 rounded-lg shadow-none"
		>
			<button 
				role="tab" 
				class="tab {hourDataTimeRange === HourDataChartOptions.Small ? 'tab-active btn-secondary' : ''} w-20 rounded-lg"
				onclick={() => hourDataTimeRange = HourDataChartOptions.Small}
			>
				{HourDataChartOptions.Small}
			</button>
			<div class="indicator tab w-20">
				<span
					class="indicator-item badge-sm badge-primary badge badge-soft font-bold"
				>
					PRO
				</span>
				<button 
					role="tab" 
					class="tab {hourDataTimeRange === HourDataChartOptions.Large ? 'tab-active btn-secondary' : ''} w-full h-full rounded-lg"
					onclick={() => hourDataTimeRange = HourDataChartOptions.Large}
				>
					{HourDataChartOptions.Large}
				</button>
			</div>
		</div>
	</div>
	
	{@render previewedMetricSubtitle()}
	<MetricBreakdownChart
		data={hourData}
		height={250}
		format="hour"
		timeRange={hourDataTimeRange === HourDataChartOptions.Large ? 'large' : 'small'}
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
