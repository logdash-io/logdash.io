<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { projectsState } from '$lib/clusters/projects/application/projects.state.svelte.js';
  import ProjectView from '$lib/clusters/projects/ui/ProjectView/ProjectView.svelte';
  import { Feature } from '$lib/shared/types';
  import { ArrowRightIcon } from 'lucide-svelte';
  import { fly } from 'svelte/transition';
  import ProjectsSwitcher from '../../../projects/ui/ProjectsSwitcher/ProjectsSwitcher.svelte';
  import { clustersState } from '../../application/clusters.state.svelte.js';
  import SetupMonitoringButton from '../../../projects/ui/presentational/SetupMonitoringButton.svelte';
  import { userState } from '$lib/shared/user/application/user.state.svelte.js';
  import { monitoringState } from '$lib/clusters/projects/application/monitoring.state.svelte';

  type Props = {
    priorityClusterId?: string;
  };

  const isOnDemoDashboard = $derived(
    page.url.pathname.includes('/demo-dashboard'),
  );

  const { priorityClusterId }: Props = $props();
  const clusterId = priorityClusterId ?? page.params.cluster_id;
  const projectId = $derived(page.url.searchParams.get('project_id'));

  const hasLogging = $derived(
    projectsState.hasFeature(projectId, Feature.LOGGING),
  );
  const hasMetrics = $derived(
    projectsState.hasFeature(projectId, Feature.METRICS),
  );
  const hasMonitoring = $derived(
    projectsState.hasFeature(projectId, Feature.MONITORING),
  );

  const isSettingUp = $derived(
    page.url.pathname.includes('/setup') ||
    page.url.pathname.includes('/configure'),
  );

  $effect(() => {
    if (isSettingUp || !userState.hasEarlyAccess || isOnDemoDashboard) {
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

    {#if hasLogging || hasMetrics || hasMonitoring}
      <div
        class="z-20 mr-auto flex items-center gap-2 sm:ml-auto sm:mr-0"
      >
        {#if !hasLogging && projectsState.ready}
          <button
            in:fly={{ y: -2, duration: 100 }}
            onclick={() => {
							goto(
								`/app/clusters/${clusterId}/configure/logging?project_id=${page.url.searchParams.get('project_id')}`,
							);
						}}
            class="btn btn-secondary btn-sm gap-1 opacity-90"
          >
            Setup logging
            <ArrowRightIcon class="h-4 w-4" />
          </button>
        {/if}

        {#if !hasMetrics && projectsState.ready}
          <button
            in:fly={{ y: -2, duration: 100 }}
            onclick={() => {
							goto(
								`/app/clusters/${clusterId}/configure/metrics?project_id=${page.url.searchParams.get('project_id')}`,
							);
						}}
            class="btn btn-secondary btn-sm gap-1 opacity-90"
          >
            Setup metrics
            <ArrowRightIcon class="h-4 w-4" />
          </button>
        {/if}

        {#if userState.hasEarlyAccess && !hasMonitoring && !isOnDemoDashboard && clustersState.ready}
          <SetupMonitoringButton
            class="btn btn-secondary btn-sm gap-1 opacity-90"
            canAddMore={true}
            onSubmit={(url) => {
						goto(
							`/app/clusters/${clusterId}/configure/monitoring?project_id=${page.url.searchParams.get(
								'project_id',
							)}&url=${encodeURIComponent(url)}`,
						);
					}}>
            Setup monitoring
            <ArrowRightIcon class="h-4 w-4" />
          </SetupMonitoringButton>
        {/if}
      </div>
    {/if}
  </div>

  {#if projectId}
    <ProjectView />
  {/if}
</div>
