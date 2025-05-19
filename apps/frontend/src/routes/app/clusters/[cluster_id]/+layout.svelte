<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { page } from '$app/state';
	import { projectsState } from '$lib/clusters/projects/application/projects.state.svelte.js';
	import type { Project } from '$lib/clusters/projects/domain/project.js';
	import { onMount, type Snippet } from 'svelte';

	const {
		children,
		data,
	}: { children: Snippet; data: { projects: Project[] } } = $props();

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
