<script lang="ts">
	import { browser } from '$app/environment';
	import { isDev } from '$lib';
	import { PostHog } from 'posthog-js';
	import { getContext, onMount, type Snippet } from 'svelte';

	const { children }: { children: Snippet } = $props();
	const posthog = getContext<PostHog>('posthog');

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
