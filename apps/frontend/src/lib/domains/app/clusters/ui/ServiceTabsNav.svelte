<script lang="ts">
  import { page } from '$app/state';
  import { projectsState } from '$lib/domains/app/projects/application/projects.state.svelte.js';
  import { metricsState } from '$lib/domains/app/projects/application/metrics.state.svelte.js';
  import { Feature } from '$lib/domains/shared/types.js';
  import { ScrollArea } from '@logdash/hyper-ui/presentational';
  import HomeIcon from '$lib/domains/shared/icons/HomeIcon.svelte';
  import LogsIcon from '$lib/domains/shared/icons/LogsIcon.svelte';
  import MetricsIcon from '$lib/domains/shared/icons/MetricsIcon.svelte';
  import MonitoringIcon from '$lib/domains/shared/icons/MonitoringIcon.svelte';
  import SettingsIcon from '$lib/domains/shared/icons/SettingsIcon.svelte';
  import type { ClassValue } from 'svelte/elements';

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

  const tabClass = (active: boolean): ClassValue => [
    'flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-sm',
    {
      'bg-surface-100 text-fg-default': active,
      'text-neutral-400 hover:text-fg-default hover:bg-surface-hover': !active,
    },
  ];
</script>

<ScrollArea orientation="x" class="flex min-w-0 items-center">
  <nav class="flex items-center gap-1">
    {#each visibleTabs as tab (tab.id)}
      <!-- eslint-disable svelte/no-navigation-without-resolve -- dynamic project route -->
      <a href={tab.path} class={tabClass(isActive(tab.id, tab.path))}>
        <tab.icon class="size-3.5 shrink-0" />
        {tab.label}
      </a>
      <!-- eslint-enable svelte/no-navigation-without-resolve -->
    {/each}
  </nav>
</ScrollArea>
