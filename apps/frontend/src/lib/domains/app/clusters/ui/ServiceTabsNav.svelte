<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { projectsState } from '$lib/domains/app/projects/application/projects.state.svelte.js';
  import { metricsState } from '$lib/domains/app/projects/application/metrics.state.svelte.js';
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import SetupMonitoringButton from '$lib/domains/app/projects/ui/presentational/SetupMonitoringButton.svelte';
  import { Feature } from '$lib/domains/shared/types.js';
  import { Tooltip } from '@logdash/hyper-ui/presentational';
  import { PlusIcon } from 'lucide-svelte';
  import { fly } from 'svelte/transition';
  import { MonitorMode } from '$lib/domains/app/projects/domain/monitoring/monitor-mode.js';

  type Props = {
    clusterId: string;
    projectId: string;
  };
  const { clusterId, projectId }: Props = $props();

  const basePath = $derived(`/app/clusters/${clusterId}/${projectId}`);

  const hasLogging = $derived(
    projectsState.hasFeature(projectId, Feature.LOGGING),
  );
  const hasMetrics = $derived(
    projectsState.hasFeature(projectId, Feature.METRICS) &&
      metricsState.simplifiedMetrics.length > 0,
  );
  const hasMonitoring = $derived(
    projectsState.hasFeature(projectId, Feature.MONITORING) &&
      monitoringState.monitors.length > 0,
  );

  const hasMissingFeatures = $derived(
    !hasLogging || !hasMetrics || !hasMonitoring,
  );

  const currentPath = $derived(page.url.pathname);

  const isActive = (path: string) => {
    if (path === basePath) {
      return currentPath === basePath || currentPath === `${basePath}/`;
    }
    return currentPath.startsWith(path);
  };

  const tabs = $derived([
    { id: 'overview', label: 'Overview', path: basePath, always: true },
    { id: 'logs', label: 'Logs', path: `${basePath}/logs`, always: false },
    {
      id: 'metrics',
      label: 'Metrics',
      path: `${basePath}/metrics`,
      always: false,
    },
    {
      id: 'monitoring',
      label: 'Monitoring',
      path: `${basePath}/monitoring`,
      always: false,
    },
    {
      id: 'settings',
      label: 'Settings',
      path: `${basePath}/settings`,
      always: true,
    },
  ]);

  const visibleTabs = $derived(
    tabs.filter((tab) => {
      if (tab.always) return true;
      if (tab.id === 'logs') return hasLogging;
      if (tab.id === 'metrics') return hasMetrics;
      if (tab.id === 'monitoring') return hasMonitoring;
      return true;
    }),
  );

  const tabClass = (active: boolean) => [
    'px-4 py-2 text-sm font-medium transition-colors ld-card-rounding',
    {
      'bg-base-100 text-base-content shadow-sm': active,
      'text-base-content/70 hover:text-base-content hover:bg-base-100/50':
        !active,
    },
  ];
</script>

<div class="z-20 flex items-center gap-2 bg-base-300/20 px-4 backdrop-blur-sm">
  {#if hasMissingFeatures && projectsState.ready}
    <Tooltip
      content={addFeaturesMenu}
      interactive={true}
      placement="bottom"
      trigger="click"
    >
      <button
        class={[...tabClass(false), 'flex items-center gap-1.5']}
        data-posthog-id="add-features-tab-button"
        onclick={(e) => {
          e.stopPropagation();
        }}
      >
        <PlusIcon class="h-4 w-4" />
      </button>
    </Tooltip>
  {/if}

  <nav class="flex items-center gap-1">
    {#each visibleTabs as tab}
      <a href={tab.path} class={tabClass(isActive(tab.path))}>
        {tab.label}
      </a>
    {/each}
  </nav>
</div>

{#snippet addFeaturesMenu(close: () => void)}
  <ul
    class="menu dropdown-content text-secondary ld-card-base rounded-box z-1 w-fit whitespace-nowrap p-2 shadow"
  >
    {#if !hasLogging && projectsState.ready}
      <li class="py-0.5">
        <button
          in:fly={{ y: -2, duration: 100 }}
          onclick={() => {
            goto(
              `/app/clusters/${clusterId}/configure/logging?project_id=${projectId}`,
            );
          }}
          class="flex w-full items-center justify-between"
        >
          Add logging
          <PlusIcon class="h-4 w-4" />
        </button>
      </li>
    {/if}

    {#if !hasMetrics && projectsState.ready}
      <li class="py-0.5">
        <button
          in:fly={{ y: -2, duration: 100 }}
          onclick={() => {
            goto(
              `/app/clusters/${clusterId}/configure/metrics?project_id=${projectId}`,
            );
          }}
          class="flex w-full items-center justify-between"
        >
          Add metrics
          <PlusIcon class="h-4 w-4" />
        </button>
      </li>
    {/if}

    {#if !hasMonitoring && clustersState.ready}
      <li class="py-0.5">
        <SetupMonitoringButton
          class="flex w-full items-center justify-between"
          canAddMore={true}
          onSubmit={({ name, mode }) => {
            const params = new URLSearchParams({
              project_id: projectId,
              mode,
            });

            if (mode === MonitorMode.PULL) {
              params.set('url', encodeURIComponent(name));
            } else {
              params.set('name', encodeURIComponent(name));
            }

            goto(
              `/app/clusters/${clusterId}/configure/monitoring?${params.toString()}`,
            );
          }}
        >
          Add monitoring
          <PlusIcon class="h-4 w-4" />
        </SetupMonitoringButton>
      </li>
    {/if}
  </ul>
{/snippet}
