<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { metricsState } from '$lib/domains/app/projects/application/metrics.state.svelte.js';
  import MetricsListener from '$lib/domains/app/projects/ui/presentational/MetricsListener.svelte';
  import MetricTile from '$lib/domains/app/projects/ui/ProjectView/tiles/MetricTile.svelte';
  import { exposedConfigState } from '$lib/domains/shared/exposed-config/application/exposed-config.state.svelte.js';
  import { CloseIcon } from '@logdash/hyper-ui/icons';
  import RocketIcon from '$lib/domains/shared/icons/RocketIcon.svelte';
  import { UserTier } from '$lib/domains/shared/types.js';
  import DataTile from '$lib/domains/shared/ui/components/DataTile.svelte';
  import UpgradeElement from '$lib/domains/shared/upgrade/UpgradeElement.svelte';
  import { userState } from '$lib/domains/shared/user/application/user.state.svelte.js';
  import { cubicInOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';

  const previewedMetricId = $derived(page.params.metric_id);
  const clusterId = $derived(page.params.cluster_id);
  const projectId = $derived(page.params.project_id);
  const isDemoDashboard = $derived(
    page.url.pathname.includes('/demo-dashboard'),
  );
  const previewedMetric = $derived(
    previewedMetricId ? metricsState.getById(previewedMetricId) : null,
  );
  const currentMetricsLimit = $derived(
    exposedConfigState.maxRegisteredMetrics(userState.tier),
  );

  // todo: move this responsibility to exposed config state; postponed cause I don't know yet how much it will grow
  const metricsLimitPlanDifference = $derived.by(() => {
    const currentMetricsLimit = exposedConfigState.maxRegisteredMetrics(
      userState.tier,
    );
    const upgradedMetricsLimit = exposedConfigState.maxRegisteredMetrics(
      UserTier.EARLY_BIRD,
    );

    return upgradedMetricsLimit / currentMetricsLimit;
  });
</script>

<MetricsListener>
  <div class="flex flex-col gap-1.5">
    {#if metricsState.simplifiedMetrics.length >= currentMetricsLimit && !isDemoDashboard && !metricsState.isUsingFakeData}
      <span class="text-sm">
        {#if userState.canUpgrade}
          <UpgradeElement
            source="metrics-limit"
            class="bg-primary/20 text-primary flex w-full items-center gap-1 rounded-full px-3 py-1.5"
          >
            <RocketIcon class="text-primary size-3.5 shrink-0 mr-1" />
            Add
            <strong>{metricsLimitPlanDifference}x</strong>
            more metrics to this project.
          </UpgradeElement>
        {:else}
          <a class="underline" href="mailto:contact@logdash.io">Contact us</a>
          to add more metrics to this project.
        {/if}
      </span>
    {/if}

    {#each metricsState.displayMetrics as metric}
      <DataTile
        header={previewedMetricId === metric.id && !metricsState.isUsingFakeData
          ? header
          : emptyHeader}
        parentClass={[
          'group relative transition-all duration-200',
          {
            'pt-9':
              previewedMetricId === metric.id && !metricsState.isUsingFakeData,
            'pt-0':
              previewedMetricId !== metric.id || metricsState.isUsingFakeData,
          },
        ]}
        class={[
          'z-10 ring',
          {
            'ring-primary':
              metric.id === previewedMetricId && !metricsState.isUsingFakeData,
            'ring-transparent':
              metric.id !== previewedMetricId || metricsState.isUsingFakeData,
          },
        ]}
        delayIn={0}
        delayOut={50}
      >
        <MetricTile id={metric.id} disabled={metricsState.isUsingFakeData} />
      </DataTile>
    {/each}
  </div>
</MetricsListener>

{#snippet header()}
  <div
    class="bg-primary ring-primary absolute top-0 left-0 z-0 flex h-16 w-full items-start justify-between rounded-t-2xl text-sm leading-6 ring"
  >
    <div
      transition:fly={{
        duration: 200,
        easing: cubicInOut,
        y: 5,
      }}
      class="flex h-full w-full items-start justify-between gap-3 overflow-hidden px-3 py-1.5"
    >
      <span>Previewing</span>

      <div class="flex items-center gap-1">
        {#if !isDemoDashboard && previewedMetric}
          <button
            class="btn text-base-content hover:text-error btn-soft btn-xs gap-1"
            onclick={() => {
              if (
                confirm(
                  `Are you sure you want to delete ${previewedMetric.name} metric?`,
                )
              ) {
                metricsState.delete(projectId, previewedMetricId);
                goto(`/app/clusters/${clusterId}/${projectId}/metrics`);
              }
            }}
            data-posthog-id="delete-metric-button"
          >
            <CloseIcon class="size-3.5" />
            Delete
          </button>
        {/if}
      </div>
    </div>
  </div>
{/snippet}

{#snippet emptyHeader()}{/snippet}
