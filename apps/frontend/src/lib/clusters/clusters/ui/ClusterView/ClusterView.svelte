<script lang="ts">
  import { page } from '$app/state';
  import { monitoringState } from '$lib/clusters/projects/application/monitoring.state.svelte';
  import ProjectView from '$lib/clusters/projects/ui/ProjectView/ProjectView.svelte';
  import ProjectsSwitcher from '../../../projects/ui/ProjectsSwitcher/ProjectsSwitcher.svelte';
  import ClusterContextMenu from '../ClusterContextMenu.svelte';
  import ProjectFeaturesContextMenu from '../ProjectFeaturesContextMenu.svelte';
  import PublicDashboardContextMenu from '../PublicDashboardContextMenu.svelte';

  type Props = {
    priorityClusterId?: string;
  };

  const isOnDemoDashboard = $derived(
    page.url.pathname.includes('/demo-dashboard'),
  );

  const { priorityClusterId }: Props = $props();
  const clusterId = priorityClusterId ?? page.params.cluster_id;
  const projectId = $derived(page.url.searchParams.get('project_id'));

  const isSettingUp = $derived(
    page.url.pathname.includes('/setup') ||
      page.url.pathname.includes('/configure'),
  );

  $effect(() => {
    if (isSettingUp && !isOnDemoDashboard) {
      return;
    }

    monitoringState.sync(clusterId);

    return () => {
      monitoringState.unsync();
    };
  });
</script>

<div class="mb-8 h-full w-full space-y-4">
  <div
    class="z-10 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"
  >
    <ProjectsSwitcher
      creationDisabled={isOnDemoDashboard}
      withDefaultRedirect
    />

    {#if !isOnDemoDashboard}
      <div class="flex w-full items-center gap-2 sm:ml-auto sm:w-fit">
        <PublicDashboardContextMenu {clusterId} />

        {#if projectId}
          <ProjectFeaturesContextMenu {clusterId} />
        {:else}
          <ClusterContextMenu {clusterId} />
        {/if}
      </div>
    {/if}
  </div>

  {#if projectId}
    <ProjectView />
  {/if}
</div>
