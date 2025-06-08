<script lang="ts">
	import { metricsState } from '$lib/clusters/projects/application/metrics.state.svelte';
	import type { Snippet } from 'svelte';
	import { monitoringState } from '../application/monitoring.state.svelte.js';

	type Props = {
		url: string;
		children?: Snippet;
		onCaptureOnce?: () => void;
	};
	const { url, children, onCaptureOnce }: Props = $props();
	const isHealthy = $derived(monitoringState.isHealthy(url));
	let notified = $state(false);

	$effect(() => {
		if (isHealthy && !notified) {
			notified = true;
			onCaptureOnce?.();
		}
	});
</script>

{#if isHealthy}
	{@render children?.()}
{:else}
	<div
		class="text-primary mx-auto flex items-center gap-2 font-semibold opacity-90"
	>
		<span class="loading loading-ring loading-xl"></span>
		Waiting for service healthy...
	</div>
{/if}
