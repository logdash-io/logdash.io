<script lang="ts">
  import { page } from '$app/state';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import { projectsState } from '$lib/domains/app/projects/application/projects.state.svelte.js';
  import type { Project } from '$lib/domains/app/projects/domain/project.js';
  import { type Snippet } from 'svelte';

  const {
    children,
    data,
  }: { children: Snippet; data: { projects: Project[] } } = $props();

  const cluster = $derived(clustersState.get(page.params.cluster_id));
  const projectName = $derived(
    cluster?.projects?.find(({ id }) => id === page.params.project_id)?.name,
  );
  const names = $derived(
    [...new Set([projectName, cluster?.name].filter(Boolean))].join(' - '),
  );

  $effect(() => {
    projectsState.set(data.projects);
  });
</script>

<svelte:head>
  <title>{names ? `${names} | Logdash` : 'Logdash'}</title>
</svelte:head>

{@render children?.()}
