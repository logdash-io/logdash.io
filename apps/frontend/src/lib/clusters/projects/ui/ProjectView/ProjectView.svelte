<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { logMetricsState } from '$lib/clusters/projects/application/log-metrics.state.svelte';
	import { logsState } from '$lib/clusters/projects/application/logs.state.svelte';
	import { FEATURES } from '$lib/shared/constants/features.js';
	import FlamingoIcon from '$lib/shared/icons/FlamingoIcon.svelte';
	import { createLogger } from '$lib/shared/logger/index.js';
	import { Feature } from '$lib/shared/types.js';
	import { ArrowRightIcon, TimerIcon } from 'lucide-svelte';
	import { getContext, untrack } from 'svelte';
	import { cubicInOut } from 'svelte/easing';
	import { fade, fly } from 'svelte/transition';
	import { metricsState } from '../../application/metrics.state.svelte.js';
	import { projectsState } from '../../application/projects.state.svelte.js';
	import MetricDetails from './MetricDetails/MetricDetails.svelte';
	import DataTile from './tiles/DataTile.svelte';
	import LogsLineChartTile from './tiles/LogMetricsTile.svelte';
	import LogsListTile from './tiles/LogsTile.svelte';
	import MetricsTiles from './tiles/MetricsTiles.svelte';

	const logger = createLogger('ProjectView');
	const previewedMetricId = $derived(page.url.searchParams.get('metric_id'));
	const projectIdToSync = $derived.by(() => {
		const id = page.url.searchParams.get('project_id');

		if (!id) {
			logger.error('Synchronization failed due to missing projectId');
			return null;
		}
		return id;
	});

	const tabId = getContext<string>('tabId');

	let isPageVisible = $state(
		typeof document === 'undefined' ? true : !document.hidden,
	);

	const handleVisibilityChange = () => {
		const newVisibility = !document.hidden;
		let timeout;
		if (isPageVisible !== newVisibility) {
			if (newVisibility) {
				logger.info('Page became visible. Data sync will resume.');
				Promise.all([
					logsState.resumeSync(projectIdToSync, tabId),
					logMetricsState.resumeSync(projectIdToSync, tabId),
					metricsState.resumeSync(projectIdToSync, tabId),
					previewedMetricId
						? metricsState.previewMetric(
								projectIdToSync,
								previewedMetricId,
							)
						: Promise.resolve(),
				])
					.then(() => {
						isPageVisible = newVisibility;
					})
					.catch((error) => {
						// toast.error('Error resuming data sync:', error);
					});
			} else {
				clearTimeout(timeout);
				logger.info('Page became hidden. Data sync will be paused.');
				logsState.pauseSync();
				logMetricsState.pauseSync();
				metricsState.pauseSync();
				isPageVisible = newVisibility;
			}
		}
	};

	$effect(() => {
		if (typeof document === 'undefined') {
			return;
		}

		document.addEventListener('visibilitychange', handleVisibilityChange);
		// Ensure the initial state is correctly set after client-side hydration
		isPageVisible = !document.hidden;

		return () => {
			document.removeEventListener(
				'visibilitychange',
				handleVisibilityChange,
			);
		};
	});

	$effect(() => {
		if (
			previewedMetricId &&
			metricsState.ready &&
			!metricsState.getById(previewedMetricId)
		) {
			page.url.searchParams.delete('metric_id');
			goto(page.url.href);
		}
	});

	$effect(() => {
		if (!projectIdToSync) {
			logger.error('Synchronization failed due to missing projectId');
			return;
		}

		if (!tabId) {
			logger.error('Synchronization failed due to missing tabId');
		}

		// todo check if project has enabled features before syncing
		logger.info(
			`Syncing data for project ${projectIdToSync} on tab ${tabId}. Page is visible.`,
		);
		untrack(() => metricsState.sync(projectIdToSync, tabId));
		untrack(() => logsState.sync(projectIdToSync, tabId));
		untrack(() => logMetricsState.sync(projectIdToSync, tabId));

		return () => {
			logger.info(
				`Unsyncing data for project ${projectIdToSync} on tab ${tabId}.`,
			);
			metricsState.unsync();
			logsState.unsync();
			logMetricsState.unsync();
		};
	});

	const hasLogging = $derived.by(() => {
		const id = page.url.searchParams.get('project_id');

		return projectsState.hasFeature(id, Feature.LOGGING);
	});

	const hasMetrics = $derived.by(() => {
		const id = page.url.searchParams.get('project_id');

		return (
			projectsState.hasFeature(id, Feature.METRICS) &&
			metricsState.simplifiedMetrics.length > 0
		);
	});

	const isMobile = $derived.by(() => {
		if (typeof window === 'undefined') {
			return false;
		}

		return window.innerWidth < 640;
	});
</script>

<div class=" flex w-full max-w-full flex-col gap-4 pb-8 sm:flex-row">
	{#if !isPageVisible}
		<div
			in:fade={{ duration: 200, easing: cubicInOut }}
			out:fade={{ delay: 300, duration: 200, easing: cubicInOut }}
			class="bg-base-300/40 backdrop-blur-xs absolute left-0 top-0 z-20 h-full w-full"
		></div>

		<div
			class="bg-secondary text-secondary-content fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg px-3 py-2 shadow-lg sm:bottom-8"
			in:fly={{ duration: 200, easing: cubicInOut, y: 50 }}
			out:fly={{ delay: 300, duration: 200, easing: cubicInOut, y: 50 }}
		>
			<div class="flex items-center gap-2">
				<div class="loading loading-spinner loading-sm"></div>
				<span>Resuming data sync...</span>
			</div>
		</div>
	{/if}

	{#if hasLogging && (!previewedMetricId || isMobile) && metricsState.ready}
		<div class="flex flex-1 flex-col gap-4">
			<DataTile delayIn={0} delayOut={50}>
				<LogsListTile />
			</DataTile>

			<DataTile delayIn={100}>
				<LogsLineChartTile />
			</DataTile>
		</div>
	{/if}

	{#if previewedMetricId && projectsState.ready && hasLogging && metricsState.ready}
		<div class="flex flex-1 flex-col gap-4">
			<MetricDetails />
		</div>
	{/if}

	{#if hasMetrics && metricsState.ready}
		<div class="w-full shrink-0 sm:w-96">
			<MetricsTiles />
		</div>
	{/if}

	{#if previewedMetricId && projectsState.ready && !hasLogging}
		<div class="flex flex-1 flex-col gap-4">
			<MetricDetails />
		</div>
	{/if}

	{#if !hasMetrics && !hasLogging && projectsState.ready && metricsState.ready}
		<div class="flex w-full flex-col gap-4 sm:flex-row">
			<div
				in:fade={{ easing: cubicInOut, duration: 300 }}
				class="ld-card flex h-fit w-full flex-col gap-4 rounded-2xl text-center sm:w-2/5"
			>
				<h5 class="text-2xl font-semibold">Where features?</h5>

				<div class="p-6 xl:p-14">
					<FlamingoIcon
						class="pointer-events-none aspect-square w-full select-none rounded-2xl object-cover"
					/>
				</div>

				<span class="text-base-content text-center opacity-80">
					Your project is running… but no features are enabled.
				</span>
			</div>

			<div class="flex w-full flex-col gap-4 sm:w-3/5">
				{#each FEATURES as feature, i}
					<DataTile class="group" delayIn={i * 15}>
						<div
							class="text-secondary/60 group-hover:text-secondary flex flex-col items-start justify-between gap-4 transition-all"
						>
							<div
								class="text-secondary flex w-full items-center justify-between"
							>
								<h5 class="text-2xl font-semibold">
									{feature.title}
								</h5>

								<button
									class="btn btn-primary btn-sm gap-1 opacity-90"
									disabled={!feature.available}
									onclick={() => {
										if (!feature.available) {
											return;
										}

										goto(
											`/app/clusters/${page.params.cluster_id}/configure/${feature.id}?project_id=${page.url.searchParams.get(
												'project_id',
											)}`,
										);
									}}
								>
									{#if !feature.available}
										Coming soon <TimerIcon
											class="h-4 w-4"
										/>
									{:else}
										Setup {feature.title}
										<ArrowRightIcon class="h-4 w-4" />
									{/if}
								</button>
							</div>

							<ul>
								{#each feature.benefits as benefit}
									<li class="flex items-center gap-2">
										<ArrowRightIcon
											class="group-hover:text-primary text-secondary h-4 w-4 transition-all"
										/>
										{benefit}
									</li>
								{/each}
							</ul>
						</div>
					</DataTile>
				{/each}
			</div>
		</div>
	{/if}
</div>
