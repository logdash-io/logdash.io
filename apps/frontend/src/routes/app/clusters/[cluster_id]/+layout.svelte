<script lang="ts">
  import { invalidate } from '$app/navigation';
  import { page } from '$app/state';
  import { projectsState } from '$lib/domains/app/projects/application/projects.state.svelte.js';
  import type { Project } from '$lib/domains/app/projects/domain/project.js';
  import { type Snippet } from 'svelte';

  const {
    children,
    data,
  }: { children: Snippet; data: { projects: Project[] } } = $props();

  const isSettingUp = $derived(
    page.url.pathname.includes('/setup') ||
      page.url.pathname.includes('/configure'),
  );

  $effect(() => {
    projectsState.set(data.projects);
  });

  $effect(() => {
    if (isSettingUp) {
      invalidate(`/app/clusters/${page.params.cluster_id}`);
    }
  });
</script>

{@render children?.()}
