<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { metricsState } from '$lib/domains/app/projects/application/metrics.state.svelte.js';
  import { Tooltip } from '@logdash/hyper-ui/presentational';
  import { ArrowRightIcon } from 'lucide-svelte';
  import { cubicInOut } from 'svelte/easing';
  import { fade, fly } from 'svelte/transition';

  type Props = {
    id: string;
    disabled?: boolean;
  };
  const { id, disabled = false }: Props = $props();
  const previewedMetricId = $derived(page.params.metric_id);
  const clusterId = $derived(page.params.cluster_id);
  const projectId = $derived(page.params.project_id);

  const metric = $derived(metricsState.getById(id));

  const formatNumber = (value: number) => {
    const precision = 1;
    if (value > 1e6) {
      return `${(value / 1e6).toFixed(precision)}M`;
    } else if (value > 1e3) {
      return `${(value / 1e3).toFixed(precision)}K`;
    }
    return Number.isInteger(value)
      ? value.toString()
      : value.toFixed(precision);
  };
</script>

<div
  class={[
    'relative flex flex-col items-start justify-between gap-1 text-base font-semibold',
  ]}
>
  <Tooltip
    class={[
      'min-w-0 flex-shrink transition-all duration-200',
      {
        'text-secondary/60 group-hover:text-secondary':
          previewedMetricId !== metric.id,
      },
      {
        'text-secondary': previewedMetricId === metric.id,
      },
    ]}
    content={metric.name}
    placement="top"
  >
    <span class="truncate">
      {metric.name}
    </span>
  </Tooltip>
</div>

<div class="flex w-full gap-3 overflow-hidden leading-tight items-end">
  <Tooltip
    class="mr-auto font-mono text-4xl font-semibold"
    content={metric.value.toString()}
    placement="top"
  >
    {formatNumber(metric.value)}
  </Tooltip>

  {#if previewedMetricId !== metric.id && !disabled}
    <button
      transition:fly={{
        duration: 200,
        easing: cubicInOut,
        y: 5,
      }}
      class="btn btn-secondary btn-soft btn-xs ml-auto"
      onclick={() => {
        metricsState.setLastPreviewedMetricId(projectId, metric.id);
        goto(`/app/clusters/${clusterId}/${projectId}/metrics/${metric.id}`);
      }}
      data-posthog-id="preview-metric-button"
    >
      Preview <ArrowRightIcon class="h-3.5 w-3.5" />
    </button>
  {/if}
</div>
