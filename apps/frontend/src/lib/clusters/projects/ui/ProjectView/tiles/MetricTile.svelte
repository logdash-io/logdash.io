<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { metricsState } from '$lib/clusters/projects/application/metrics.state.svelte.js';
	import Tooltip from '$lib/shared/ui/components/Tooltip.svelte';
	import { ArrowRightIcon, TrashIcon, XIcon } from 'lucide-svelte';
	import { cubicInOut } from 'svelte/easing';
	import { fade, fly } from 'svelte/transition';

	type Props = {
		id: string;
		deletionDisabled?: boolean;
	};
	const { id, deletionDisabled }: Props = $props();
	const previewedMetricId = $derived(page.url.searchParams.get('metric_id'));

	const metric = $derived(metricsState.getById(id));

	const formatNumber = (value: number) => {
		const precision = 1;
		if (value > 1e6) {
			return `${(value / 1e6).toFixed(precision)}M`;
		} else if (value > 1e3) {
			return `${(value / 1e3).toFixed(precision)}K`;
		}
		return Number.isInteger(value)
			? value.toString()
			: value.toFixed(precision);
	};
</script>

<div
	class={[
		'relative flex flex-col items-start justify-between gap-1 text-base font-semibold',
	]}
>
	<div class="flex h-6 w-full gap-3 overflow-hidden leading-tight">
		<Tooltip
			class={[
				'truncate transition-all duration-200',
				{
					'text-secondary/60 group-hover:text-secondary':
						previewedMetricId !== metric.id,
				},
				{
					'text-secondary': previewedMetricId === metric.id,
				},
			]}
			content={metric.name}
			placement="top"
		>
			{metric.name}
		</Tooltip>

		<div class="ml-auto flex items-center gap-2">
			{#if previewedMetricId !== metric.id}
				<button
					transition:fly={{
						duration: 200,
						easing: cubicInOut,
						y: 5,
					}}
					class="btn btn-secondary btn-soft btn-xs"
					onclick={() => {
						page.url.searchParams.set('metric_id', metric.id);
						goto(page.url.href);
					}}
					data-posthog-id="preview-metric-button"
				>
					Preview <ArrowRightIcon class="h-3.5 w-3.5" />
				</button>
			{/if}

			{#if !deletionDisabled}
				<button
					class="btn btn-error btn-square btn-soft btn-xs"
					onclick={() => {
						if (
							confirm(
								`Are you sure you want to delete ${metric.name} metric?`,
							)
						) {
							metricsState.delete(
								page.url.searchParams.get('project_id'),
								metric.id,
							);
						}
					}}
					data-posthog-id="delete-metric-button"
				>
					<TrashIcon class="h-3.5 w-3.5" />
				</button>
			{/if}
		</div>
	</div>

	<Tooltip
		class="mr-auto font-mono text-4xl font-semibold"
		content={metric.value}
		placement="top"
	>
		{formatNumber(metric.value)}
	</Tooltip>
</div>
