<script lang="ts">
  import { page } from '$app/state';
  import { metricsState } from '$lib/domains/app/projects/application/metrics.state.svelte.js';
  import { ScrollArea } from '@logdash/hyper-ui/presentational';
  import ServiceTabs, { type ServiceTab } from './ServiceTabs.svelte';
  import { SERVICE_TAB_ITEMS } from './service-tabs';

  type Props = {
    clusterId: string;
    projectId: string;
  };
  const { clusterId, projectId }: Props = $props();

  const basePath = $derived(`/app/domains/${clusterId}/${projectId}`);

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

  const tabHrefs = $derived<Record<string, string>>({
    overview: basePath,
    logs: `${basePath}/logs`,
    metrics: metricsPath,
    monitoring: `${basePath}/monitoring`,
    settings: `${basePath}/settings`,
  });

  const tabs = $derived<ServiceTab[]>(
    SERVICE_TAB_ITEMS.map((item) => ({
      ...item,
      href: tabHrefs[item.id],
      active: isActive(item.id, tabHrefs[item.id]),
    })),
  );
</script>

<ScrollArea orientation="x" class="flex min-w-0 items-center">
  <ServiceTabs {tabs} />
</ScrollArea>
