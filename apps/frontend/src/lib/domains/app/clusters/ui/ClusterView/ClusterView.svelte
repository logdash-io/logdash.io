<script lang="ts">
  import { page } from '$app/state';
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import ProjectView from '$lib/domains/app/projects/ui/ProjectView/ProjectView.svelte';
  import ProjectsSwitcher from '$lib/domains/app/projects/ui/ProjectsSwitcher/ProjectsSwitcher.svelte';
  import { untrack } from 'svelte';

  type Props = {
    priorityClusterId?: string;
  };

  const isOnDemoDashboard = $derived(
    page.url.pathname.includes('/demo-dashboard'),
  );

  const { priorityClusterId }: Props = $props();
  const clusterId = priorityClusterId ?? page.params.cluster_id;
  const projectId = $derived(page.url.searchParams.get('project_id'));

  $effect(() => {
    if (!isOnDemoDashboard) {
      return;
    }

    untrack(() => monitoringState.sync(clusterId));

    return () => {
      monitoringState.unsync();
    };
  });
</script>

<div class="mb-8 h-full w-full space-y-4">
  <div
    class="z-10 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"
  >
    <ProjectsSwitcher creationDisabled={true} withDefaultRedirect />
  </div>

  {#if projectId}
    <ProjectView />
  {/if}
</div>
