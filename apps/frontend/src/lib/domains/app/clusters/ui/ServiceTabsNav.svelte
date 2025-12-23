<script lang="ts">
  import { page } from '$app/state';
  import { projectsState } from '$lib/domains/app/projects/application/projects.state.svelte.js';
  import { metricsState } from '$lib/domains/app/projects/application/metrics.state.svelte.js';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import { Feature } from '$lib/domains/shared/types.js';
  import { Tooltip } from '@logdash/hyper-ui/presentational';
  import { PlusIcon } from 'lucide-svelte';
  import { fly } from 'svelte/transition';
  import HomeIcon from '$lib/domains/shared/icons/HomeIcon.svelte';
  import LogsIcon from '$lib/domains/shared/icons/LogsIcon.svelte';
  import MetricsIcon from '$lib/domains/shared/icons/MetricsIcon.svelte';
  import MonitoringIcon from '$lib/domains/shared/icons/MonitoringIcon.svelte';
  import SettingsIcon from '$lib/domains/shared/icons/SettingsIcon.svelte';

  type Props = {
    clusterId: string;
    projectId: string;
  };
  const { clusterId, projectId }: Props = $props();

  const basePath = $derived(`/app/clusters/${clusterId}/${projectId}`);

  const selectedLogging = $derived(
    projectsState.hasFeature(projectId, Feature.LOGGING),
  );
  const selectedMetrics = $derived(
    projectsState.hasFeature(projectId, Feature.METRICS),
  );
  const selectedMonitoring = $derived(
    projectsState.hasFeature(projectId, Feature.MONITORING),
  );

  const hasMissingSelectedFeatures = $derived(
    !selectedLogging || !selectedMetrics || !selectedMonitoring,
  );

  const currentPath = $derived(page.url.pathname);

  const metricsPath = $derived.by(() => {
    const lastPreviewedId = metricsState.getLastPreviewedMetricId(projectId);
    const metricId =
      lastPreviewedId && metricsState.getById(lastPreviewedId)
        ? lastPreviewedId
        : metricsState.simplifiedMetrics[0]?.id;

    return metricId ? `${basePath}/metrics/${metricId}` : `${basePath}/metrics`;
  });

  const isActive = (tabId: string, path: string) => {
    if (path === basePath) {
      return currentPath === basePath || currentPath === `${basePath}/`;
    }
    if (tabId === 'metrics') {
      return currentPath.startsWith(`${basePath}/metrics`);
    }
    return currentPath.startsWith(path);
  };

  const tabs = $derived([
    {
      id: 'overview',
      label: 'Overview',
      path: basePath,
      always: true,
      icon: HomeIcon,
    },
    {
      id: 'logs',
      label: 'Logs',
      path: `${basePath}/logs`,
      always: false,
      icon: LogsIcon,
    },
    {
      id: 'metrics',
      label: 'Metrics',
      path: metricsPath,
      always: false,
      icon: MetricsIcon,
    },
    {
      id: 'monitoring',
      label: 'Monitoring',
      path: `${basePath}/monitoring`,
      always: false,
      icon: MonitoringIcon,
    },
    {
      id: 'settings',
      label: 'Settings',
      path: `${basePath}/settings`,
      always: true,
      icon: SettingsIcon,
    },
  ]);

  const visibleTabs = $derived(
    tabs.filter((tab) => {
      if (tab.always) return true;
      if (tab.id === 'logs') return selectedLogging;
      if (tab.id === 'metrics') return selectedMetrics;
      if (tab.id === 'monitoring') return selectedMonitoring;
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

<div class="z-20 flex items-center gap-2 bg-base-300/20 backdrop-blur-sm">
  {#if hasMissingSelectedFeatures && projectsState.ready}
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
      <a
        href={tab.path}
        class={[
          ...tabClass(isActive(tab.id, tab.path)),
          'flex items-center gap-1.5',
        ]}
      >
        <tab.icon class="h-4 w-4" />
        {tab.label}
      </a>
    {/each}
  </nav>
</div>

{#snippet addFeaturesMenu(close: () => void)}
  <ul
    class="menu dropdown-content text-secondary ld-card-base rounded-box z-1 w-fit whitespace-nowrap p-2 shadow"
  >
    {#if !selectedLogging && projectsState.ready}
      <li class="py-0.5">
        <a
          href={`${basePath}/logs`}
          in:fly={{ y: -2, duration: 100 }}
          class="flex w-full items-center justify-between"
        >
          Add logging
          <PlusIcon class="h-4 w-4" />
        </a>
      </li>
    {/if}

    {#if !selectedMetrics && projectsState.ready}
      <li class="py-0.5">
        <a
          href={`${basePath}/metrics`}
          in:fly={{ y: -2, duration: 100 }}
          class="flex w-full items-center justify-between"
        >
          Add metrics
          <PlusIcon class="h-4 w-4" />
        </a>
      </li>
    {/if}

    {#if !selectedMonitoring && clustersState.ready}
      <li class="py-0.5">
        <a
          href={`${basePath}/monitoring`}
          in:fly={{ y: -2, duration: 100 }}
          class="flex w-full items-center justify-between"
        >
          Add monitoring
          <PlusIcon class="h-4 w-4" />
        </a>
      </li>
    {/if}
  </ul>
{/snippet}
