<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { page } from '$app/state';
	import { isDev } from '$lib';
	import { monitoringState } from '$lib/clusters/projects/application/monitoring.state.svelte.js';
	import { projectsState } from '$lib/clusters/projects/application/projects.state.svelte.js';
	import type { Project } from '$lib/clusters/projects/domain/project.js';
	import { type Snippet } from 'svelte';

	const {
		children,
		data,
	}: { children: Snippet; data: { projects: Project[] } } = $props();

	const clusterId = $derived(page.params.cluster_id);

	$effect(() => {
		if (!isDev()) {
			return;
		}

		monitoringState.sync(clusterId);

		return () => {
			monitoringState.unsync();
		};
	});

	$effect(() => {
		projectsState.set(data.projects);
	});

	$effect(() => {
		if (
			page.url.pathname.includes('/setup') ||
			page.url.pathname.includes('/configure')
		) {
			invalidate(`/app/clusters/${page.params.cluster_id}`);
		}
	});
</script>

{@render children?.()}
