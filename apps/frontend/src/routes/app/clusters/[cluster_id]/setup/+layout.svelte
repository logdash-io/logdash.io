<script lang="ts">
	import { browser } from '$app/environment';
	import { isDev } from '$lib';
	import posthog from 'posthog-js';
	import { onMount, type Snippet } from 'svelte';

	const { children }: { children: Snippet } = $props();

	onMount(() => {
		if (browser && !isDev()) {
			try {
				posthog.startSessionRecording();
			} catch (e) {
				console.error('Error starting session recording:', e);
			}
		}
	});
</script>

{@render children?.()}
