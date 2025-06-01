<script lang="ts">
	import { page } from '$app/state';
	import { monitoringState } from '$lib/clusters/monitoring/application/monitoring.state.svelte.js';
	import { logsState } from '$lib/clusters/projects/application/logs.state.svelte';
	import LogsListener from '$lib/clusters/projects/ui/presentational/LogsListener.svelte';
	import DataTile from '$lib/clusters/projects/ui/ProjectView/tiles/DataTile.svelte';
	import Tooltip from '$lib/shared/ui/components/Tooltip.svelte';
	import { stripProtocol } from '$lib/shared/utils/url.js';
	import { CheckCircle } from 'lucide-svelte';
	import { getContext, type Snippet } from 'svelte';

	type Props = {
		claimer: Snippet<[boolean]>;
	};
	const { claimer }: Props = $props();
	const hasLogs = $derived(logsState.logs.length > 0);
	const tabId: string = getContext('tabId');
	const observedUrl = $derived(page.url.searchParams.get('url'));
	const pings = $derived.by(() => monitoringState.monitorPings(observedUrl));

	$effect(() => {
		monitoringState.observeUrl(page.params.cluster_id, observedUrl);

		return () => {
			monitoringState.unsync();
		};
	});
</script>

<div class="w-xl mr-auto space-y-8">
	<DataTile delayIn={0} delayOut={50}>
		<div class="flex w-full flex-col gap-2">
			<div class="flex w-full gap-2">
				<div class="flex w-full items-center gap-2">
					<h5 class="text-2xl font-semibold">
						{stripProtocol(observedUrl)}
					</h5>

					<div class="badge badge-soft badge-success">
						<span class="status status-success"></span>
						healthy
					</div>
				</div>

				<span
					class="loading loading-ring loading-sm duration-1000"
				></span>
			</div>

			<div class="flex w-full flex-col gap-1">
				<div
					class="flex h-12 w-full items-center justify-start gap-1 overflow-hidden lg:gap-1"
				>
					{#each pings as _, i}
						<Tooltip content={`Service is up ${i}`} placement="top">
							<div
								class={[
									'h-8 w-1.5 shrink-0 rounded-sm hover:h-12 lg:w-[7px]',
									{
										'bg-gradient-to-b from-green-600 via-green-600/80 to-green-600': true,
										'bg-warning': false,
									},
								]}
							></div>
						</Tooltip>
					{/each}

					{#each Array.from({ length: 60 - pings.length }) as _, i}
						<div
							class={[
								'h-8 w-1.5 shrink-0 rounded-sm hover:h-12 lg:w-[7px]',
								{
									'bg-gradient-to-b from-neutral-700 via-neutral-700/80 to-neutral-700': true,
									'bg-warning': false,
								},
							]}
						></div>
					{/each}
				</div>
			</div>
		</div>
	</DataTile>
</div>

<div class="flexx hiddxen fixed left-0 top-0 z-50 h-full w-full bg-black/60">
	<div
		class="bg-base-200 sm:w-xl absolute right-0 top-0 mx-auto flex h-full w-full max-w-2xl flex-col gap-4 overflow-auto p-6 sm:p-8"
	>
		<div class="space-y-2">
			<h5 class="text-2xl font-semibold">
				Setup Monitoring for your project
			</h5>

			<p class="text-base-content opacity-60">
				Add url and monitor your project. Your dashboard will update
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
