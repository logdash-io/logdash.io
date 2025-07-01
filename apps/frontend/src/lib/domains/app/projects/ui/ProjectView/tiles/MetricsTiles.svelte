<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { metricsState } from '$lib/domains/app/projects/application/metrics.state.svelte.js';
  import { exposedConfigState } from '$lib/domains/shared/exposed-config/application/exposed-config.state.svelte.js';
  import { UserTier } from '$lib/domains/shared/types.js';
  import UpgradeElement from '$lib/domains/shared/upgrade/UpgradeElement.svelte';
  import { userState } from '$lib/domains/shared/user/application/user.state.svelte.js';
  import { AlertTriangleIcon, XIcon } from 'lucide-svelte';
  import { cubicInOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import MetricsListener from '$lib/domains/app/projects/ui/presentational/MetricsListener.svelte';
  import DataTile from '$lib/domains/app/projects/ui/ProjectView/tiles/DataTile.svelte';
  import MetricTile from '$lib/domains/app/projects/ui/ProjectView/tiles/MetricTile.svelte';

  const previewedMetricId = $derived(page.url.searchParams.get('metric_id'));
  const isDemoDashboard = $derived(
    page.url.pathname.includes('/demo-dashboard'),
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

{#snippet header()}
  <div
    class="bg-primary ring-primary absolute top-0 left-0 z-0 flex h-12 w-full items-start justify-between rounded-t-lg text-sm leading-6 ring"
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

      <button
        class="btn btn-secondary btn-soft btn-xs"
        onclick={() => {
          page.url.searchParams.delete('metric_id');
          goto(page.url.href);
        }}
        data-posthog-id="close-metric-preview-button"
      >
        Close
        <XIcon class="h-3.5 w-3.5" />
      </button>
    </div>
  </div>
{/snippet}

{#snippet emptyHeader()}{/snippet}

<MetricsListener>
  <div class="flex flex-col gap-4">
    {#if metricsState.simplifiedMetrics.length >= currentMetricsLimit && !isDemoDashboard}
      <div
        class="bg-primary/20 text-primary flex w-full items-center gap-2 rounded-lg px-3 py-1.5"
      >
        <AlertTriangleIcon class="text-primary h-4 w-4 shrink-0" />
        <span class="text-sm">
          {#if userState.tier === UserTier.FREE}
            <UpgradeElement source="metrics-limit">
              Upgrade to add
              <strong>{metricsLimitPlanDifference}x</strong>
              more metrics to this project.
            </UpgradeElement>
          {:else}
            <a class="underline" href="mailto:contact@logdash.io">Contact us</a>
            to add more metrics to this project.
          {/if}
        </span>
      </div>
    {/if}

    {#each metricsState.simplifiedMetrics as metric}
      <DataTile
        header={previewedMetricId === metric.id ? header : emptyHeader}
        parentClass={[
          'group relative transition-all duration-200',
          {
            'pt-9': previewedMetricId === metric.id,
            'pt-0': previewedMetricId !== metric.id,
          },
        ]}
        class={[
          'z-10 ring',
          {
            'ring-primary': metric.id === previewedMetricId,
            'ring-transparent': metric.id !== previewedMetricId,
          },
        ]}
        delayIn={0}
        delayOut={50}
      >
        <MetricTile deletionDisabled={isDemoDashboard} id={metric.id} />
      </DataTile>
    {/each}
  </div>
</MetricsListener>
