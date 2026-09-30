<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { metricsState } from '$lib/domains/app/projects/application/metrics.state.svelte.js';
  import ProjectSync from '$lib/domains/app/projects/ui/ProjectView/ProjectSync.svelte';
  import MetricsTab from '$lib/domains/app/projects/ui/ProjectView/MetricDetails/MetricsTab.svelte';
  import type { PageProps } from './$types';

  const { params }: PageProps = $props();

  const clusterId = $derived(params.cluster_id);
  const projectId = $derived(params.project_id);

  $effect(() => {
    if (!metricsState.ready) {
      return;
    }

    const lastPreviewedId = metricsState.getLastPreviewedMetricId(projectId);
    const metricToPreview =
      lastPreviewedId && metricsState.getById(lastPreviewedId)
        ? lastPreviewedId
        : metricsState.simplifiedMetrics[0]?.id;

    if (!metricToPreview) {
      return;
    }

    void goto(
      resolve('/app/domains/[cluster_id]/[project_id]/metrics/[metric_id]', {
        cluster_id: clusterId,
        project_id: projectId,
        metric_id: metricToPreview,
      }),
      { replaceState: true },
    );
  });
</script>

<ProjectSync>
  <MetricsTab />
</ProjectSync>
