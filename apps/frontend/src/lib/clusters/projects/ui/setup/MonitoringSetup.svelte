<script lang="ts">
	import { logsState } from '$lib/clusters/projects/application/logs.state.svelte';
	import LogsListener from '$lib/clusters/projects/ui/presentational/LogsListener.svelte';
	import DataTile from '$lib/clusters/projects/ui/ProjectView/tiles/DataTile.svelte';
	import LogsLineChartTile from '$lib/clusters/projects/ui/ProjectView/tiles/LogsLineChartTile.svelte';
	import LogsListTile from '$lib/clusters/projects/ui/ProjectView/tiles/LogsListTile.svelte';
	import { ArrowRightIcon, CheckCircle } from 'lucide-svelte';
	import { getContext, onMount, type Snippet } from 'svelte';
	import { logMetricsState } from '../../application/log-metrics.state.svelte.js';
	import UrlsConfigurator from './UrlsConfigurator.svelte';
	import Tooltip from '$lib/shared/ui/components/Tooltip.svelte';
	import { monitoringState } from '$lib/clusters/monitoring/application/monitoring.state.svelte.js';
	import { page } from '$app/state';

	type Props = {
		claimer: Snippet<[boolean]>;
	};
	const { claimer }: Props = $props();
	const hasLogs = $derived(logsState.logs.length > 0);
	const tabId: string = getContext('tabId');
	const observedUrl = $derived(page.url.searchParams.get('url'));

	$effect(() => {
		monitoringState.observeUrl(tabId, observedUrl);

		return () => {
			monitoringState.unsync();
		};
	});
</script>

<div class="w-full space-y-8">
	<DataTile delayIn={0} delayOut={50}>
		<div class="flex w-full flex-col gap-2">
			<div class="flex w-full flex-col gap-2">
				<h5 class="text-2xl font-semibold">Monitoring</h5>

				<p class="text-base-content opacity-60">
					Live pings from your service url.
				</p>
			</div>

			<div class="flex w-full flex-col gap-1">
				<span>{observedUrl}</span>

				<div
					class="flex h-12 w-full items-center justify-start gap-1 overflow-hidden lg:gap-1"
				>
					{#each new Array(50) as _, i}
						<Tooltip content={`Service is up ${i}`} placement="top">
							<div
								class={[
									'h-10 w-1.5 shrink-0 rounded-sm hover:h-12 lg:w-[7px]',
									{
										'bg-gradient-to-b from-green-600 via-green-600/80 to-green-600': true,
										'bg-warning': false,
									},
								]}
							></div>
						</Tooltip>
					{/each}
				</div>
			</div>
		</div>
	</DataTile>
</div>

<div class="flexx hiddxen fixed left-0 top-0 z-50 h-full w-full bg-black/60">
	<div
		class="bg-base-200 sm:w-xl absolute right-0 top-0 mx-auto flex h-full w-full max-w-2xl flex-col gap-4 p-6 sm:p-8"
	>
		<div class="space-y-2">
			<h5 class="text-2xl font-semibold">
				Setup Monitoring for your project
			</h5>

			<p class="text-base-content opacity-60">
				Add urls and monitor your project. Your dashboard will update
				automatically as we send pings.
			</p>
		</div>

		<div class="collapse-open collapse overflow-visible rounded-none">
			<div class="px-1 py-4 font-semibold">
				<span>1. Configure url</span>
			</div>

			<div class="space-y-2 text-3xl font-semibold">
				<div
					class="text-secondary italicx relative flex items-center gap-2"
				>
					{page.url.searchParams.get('url')}
				</div>
			</div>
		</div>

		<div class="collapse-open">
			<div class="px-1 py-4 font-semibold">
				<span>2. Capture pings</span>
			</div>

			<div class="text-sm">
				<LogsListener
					onCaptureOnce={() => {
						// toast.success('Logs captured!');
					}}
				>
					<div
						class="flex items-center justify-start gap-2 font-semibold"
					>
						<CheckCircle class="text-success h-5 w-5" />
						<span class="text-success opacity-80">
							Logs captured successfully!
						</span>
					</div>
				</LogsListener>
			</div>
		</div>

		{@render claimer(hasLogs)}
	</div>
</div>
