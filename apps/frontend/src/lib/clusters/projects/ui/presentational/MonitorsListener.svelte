<script lang="ts">
	import { metricsState } from '$lib/clusters/projects/application/metrics.state.svelte';
	import type { Snippet } from 'svelte';

	type Props = {
		children?: Snippet;
		onCaptureOnce?: () => void;
	};
	const { children, onCaptureOnce }: Props = $props();
	const hasMetrics = $derived(metricsState.simplifiedMetrics.length > 0);
	let notified = $state(false);

	$effect(() => {
		if (hasMetrics && !notified) {
			notified = true;
			onCaptureOnce?.();
		}
	});
</script>

{#if hasMetrics}
	{@render children?.()}
{:else}
	<div
		class="text-primary mx-auto flex items-center gap-2 font-semibold opacity-90"
	>
		<span class="loading loading-ring loading-xl"></span>
		Listening for metrics...
	</div>
{/if}
