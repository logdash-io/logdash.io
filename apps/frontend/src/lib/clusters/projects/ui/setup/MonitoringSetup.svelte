<script lang="ts">
	import { page } from '$app/state';
	import { monitoringState } from '$lib/clusters/projects/application/monitoring.state.svelte.js';
	import DataTile from '$lib/clusters/projects/ui/ProjectView/tiles/DataTile.svelte';
	import Tooltip from '$lib/shared/ui/components/Tooltip.svelte';
	import { stripProtocol } from '$lib/shared/utils/url.js';
	import { CheckCircle } from 'lucide-svelte';
	import { getContext, type Snippet } from 'svelte';
	import MonitorsListener from '../presentational/PingsListener.svelte';
	import { goto } from '$app/navigation';
	import { autoFocus } from '$lib/shared/ui/actions/use-autofocus.svelte.js';

	type Props = {
		claimer: Snippet<[boolean]>;
	};
	const { claimer }: Props = $props();
	const MIN_NAME_LENGTH = 1;
	const MAX_NAME_LENGTH = 50;

	const clusterId = $derived(page.params.cluster_id);
	const observedUrl = $derived(page.url.searchParams.get('url'));
	const nameParam = $derived(
		decodeURIComponent(page.url.searchParams.get('name') || ''),
	);
	const isHealthy = $derived(monitoringState.isPreviewHealthy(observedUrl));
	const pings = $derived.by(() => monitoringState.previewPings(observedUrl));
	let monitorName = $state(
		nameParam ?? (stripProtocol(page.url.searchParams.get('url')) || ''),
	);

	$effect(() => {
		monitoringState.previewUrl(clusterId, observedUrl);

		return () => {
			monitoringState.stopUrlPreview();
		};
	});

	$effect(() => {
		if (nameParam === monitorName) {
			return;
		}

		page.url.searchParams.set('name', encodeURIComponent(monitorName));
		goto(page.url.toString(), {
			replaceState: true,
			keepFocus: true,
			noScroll: true,
		});
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

					<div
						class={[
							'badge badge-soft',
							{
								'badge-success': isHealthy,
								'badge-error': !isHealthy,
							},
						]}
					>
						<span
							class={[
								'status',
								{
									'status-success': isHealthy,
									'status-error': !isHealthy,
								},
							]}
						></span>
						{isHealthy ? 'up' : 'down'}
					</div>
				</div>

				<span
					class="loading loading-ring loading-sm duration-1000"
				></span>
			</div>

			<div class="flex w-full flex-col gap-1">
				<div
					class="flex h-12 w-full items-center justify-end gap-1 overflow-hidden lg:gap-1"
				>
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

					{#each pings as ping, i}
						{@const pingHealthy =
							ping.statusCode >= 200 && ping.statusCode < 400}
						<Tooltip content={`Service is up ${i}`} placement="top">
							<div
								class={[
									'h-8 w-1.5 shrink-0 rounded-sm bg-gradient-to-b hover:h-12 lg:w-[7px]',
									{
										'from-green-600 via-green-600/80 to-green-600':
											pingHealthy,
										'from-red-600 via-red-600/80 to-red-600':
											!pingHealthy,
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
				<div class="text-secondary relative flex items-center gap-2">
					{page.url.searchParams.get('url')}
				</div>
			</div>
		</div>

		<div class="collapse-open collapse overflow-visible rounded-none">
			<div class="px-1 py-4 font-semibold">
				<span>2. Choose name</span>
			</div>

			<div class="space-y-2 text-3xl font-semibold">
				<input
					type="text"
					bind:value={monitorName}
					placeholder={stripProtocol(observedUrl)}
					minlength={MIN_NAME_LENGTH}
					maxlength={MAX_NAME_LENGTH}
					class="input-sm input-ghost selection:bg-secondary/20 border-secondary/20 focus:border-primary h-full w-full rounded-lg px-3 py-2 text-lg font-semibold outline-0 focus:bg-transparent"
					use:autoFocus={{
						selectAll: true,
					}}
				/>
			</div>
		</div>

		<div class="collapse-open">
			<div class="px-1 py-4 font-semibold">
				<span>3. Capture pings</span>
			</div>

			<div class="text-sm">
				<MonitorsListener url={observedUrl} onCaptureOnce={() => {}}>
					<div
						class="flex items-center justify-start gap-2 font-semibold"
					>
						<CheckCircle class="text-success h-5 w-5" />
						<span class="text-success opacity-80">
							Pings captured successfully!
						</span>
					</div>
				</MonitorsListener>
			</div>
		</div>

		{@render claimer(isHealthy)}
	</div>
</div>
