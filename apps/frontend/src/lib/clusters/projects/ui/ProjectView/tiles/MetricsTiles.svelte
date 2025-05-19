<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { metricsState } from '$lib/clusters/projects/application/metrics.state.svelte.js';
	import { cubicInOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';
	import MetricsListener from '../../presentational/MetricsListener.svelte';
	import DataTile from './DataTile.svelte';
	import MetricTile from './MetricTile.svelte';
	import { XIcon } from 'lucide-svelte';

	const previewedMetricId = $derived(page.url.searchParams.get('metric_id'));
	const isDemoDashboard = $derived(
		page.url.pathname.includes('/demo-dashboard'),
	);
</script>

{#snippet header()}
	<div
		class="bg-primary ring-primary absolute top-0 left-0 z-0 flex h-12 w-full items-start justify-between rounded-t-lg text-sm leading-6 ring"
	>
		<div
			transition:fly={{
				duration: 200,
				easing: cubicInOut,
				y: 5,
			}}
			class="flex h-full w-full items-start justify-between gap-3 overflow-hidden px-3 py-1.5"
		>
			<span>Previewing</span>

			<button
				class="btn btn-secondary btn-soft btn-xs"
				onclick={() => {
					page.url.searchParams.delete('metric_id');
					goto(page.url.href);
				}}
				data-posthog-id="close-metric-preview-button"
			>
				Close <XIcon class="h-3.5 w-3.5" />
			</button>
		</div>
	</div>
{/snippet}

{#snippet emptyHeader()}{/snippet}

<MetricsListener>
	<div class="flex flex-col gap-4">
		{#each metricsState.simplifiedMetrics as metric}
			<DataTile
				header={previewedMetricId === metric.id ? header : emptyHeader}
				parentClass={[
					'group relative transition-all duration-200',
					{
						'pt-9': previewedMetricId === metric.id,
						'pt-0': previewedMetricId !== metric.id,
					},
				]}
				class={[
					'z-10 ring',
					{
						'ring-primary': metric.id === previewedMetricId,
						'ring-transparent': metric.id !== previewedMetricId,
					},
				]}
				delayIn={0}
				delayOut={50}
			>
				<MetricTile deletionDisabled={isDemoDashboard} id={metric.id} />
			</DataTile>
		{/each}
	</div>
</MetricsListener>
