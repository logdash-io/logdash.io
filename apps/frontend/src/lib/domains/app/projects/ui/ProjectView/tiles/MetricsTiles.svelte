<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { metricsState } from '$lib/domains/app/projects/application/metrics.state.svelte.js';
  import { MetricHistoryService } from '$lib/domains/app/projects/infrastructure/metric-history.service.js';
  import MetricsColumn, {
    type MetricsColumnItem,
  } from '$lib/domains/app/projects/ui/ProjectView/tiles/MetricsColumn.svelte';
  import SdkSetupPrompt from '$lib/domains/app/projects/ui/setup/SdkSetupPrompt.svelte';
  import { exposedConfigState } from '$lib/domains/shared/exposed-config/application/exposed-config.state.svelte.js';
  import { Feature, UserTier } from '$lib/domains/shared/types.js';
  import UpgradeElement from '$lib/domains/shared/upgrade/UpgradeElement.svelte';
  import { userState } from '$lib/domains/shared/user/application/user.state.svelte.js';

  const HISTORY_MINUTES = 60;
  const HISTORY_REFRESH_MS = 60_000;

  const clusterId = $derived(page.params.cluster_id);
  const projectId = $derived(page.params.project_id);
  const activeMetricId = $derived(page.params.metric_id);

  let setupOpen = $state(false);
  let histories = $state<Record<string, number[]>>({});
  let visibilityState = $state<DocumentVisibilityState>('visible');

  const metricIds = $derived(
    metricsState.simplifiedMetrics.map(({ id }) => id).join(','),
  );
  const metrics = $derived<MetricsColumnItem[]>(
    metricsState.simplifiedMetrics.map((metric) => ({
      id: metric.id,
      name: metric.name,
      value: metric.value,
      samples: [...(histories[metric.id] ?? []), metric.value],
      href:
        clusterId && projectId
          ? resolve(
              '/app/domains/[cluster_id]/[project_id]/metrics/[metric_id]',
              {
                cluster_id: clusterId,
                project_id: projectId,
                metric_id: metric.id,
              },
            )
          : undefined,
      active: metric.id === activeMetricId,
    })),
  );
  const atLimit = $derived(
    metrics.length > 0 &&
      metrics.length >= exposedConfigState.maxRegisteredMetrics(userState.tier),
  );
  const upgradeMultiplier = $derived(
    exposedConfigState.maxRegisteredMetrics(UserTier.EARLY_BIRD) /
      exposedConfigState.maxRegisteredMetrics(userState.tier),
  );

  $effect(() => {
    const ids = metricIds ? metricIds.split(',') : [];
    const id = metricsState.projectId;

    if (!id || ids.length === 0 || visibilityState === 'hidden') {
      return;
    }

    let cancelled = false;

    const refresh = async (): Promise<void> => {
      const entries = await Promise.all(
        ids.map(async (metricId) => {
          try {
            return [
              metricId,
              await MetricHistoryService.readRecentMinutes(
                id,
                metricId,
                HISTORY_MINUTES,
              ),
            ] as const;
          } catch {
            return [metricId, histories[metricId] ?? []] as const;
          }
        }),
      );

      if (!cancelled) {
        histories = Object.fromEntries(entries);
      }
    };

    void refresh();
    const timer = setInterval(() => void refresh(), HISTORY_REFRESH_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  });

  function onNewMetric(): void {
    setupOpen = !setupOpen;
  }
</script>

<svelte:document bind:visibilityState />

<MetricsColumn
  {metrics}
  tracked={metrics.length}
  loading={!metricsState.ready}
  {onNewMetric}
>
  {#if setupOpen && projectId}
    <div class="flex flex-col items-start gap-3 px-3 pt-1 pb-2">
      <span class="text-fg-tertiary text-sm">
        Copy the prompt into your AI assistant to start sending metrics.
      </span>
      <SdkSetupPrompt {projectId} feature={Feature.METRICS} />
    </div>
  {/if}

  {#if atLimit}
    <div class="text-fg-muted px-3 pb-2 text-sm">
      {#if userState.canUpgrade}
        This service tracks as many metrics as your plan allows.
        <UpgradeElement
          source="metrics-limit"
          class="text-fg-default inline underline underline-offset-2"
        >
          Upgrade for {upgradeMultiplier}x more
        </UpgradeElement>
      {:else if userState.isAnonymous}
        <a
          class="text-fg-default underline underline-offset-2"
          href={resolve(
            `/app/auth?flow=claim&next_url=${encodeURIComponent(`${page.url.pathname}?claimed=1`)}`,
          )}
          data-posthog-id="metrics-tiles-claim-cta"
        >
          Claim your dashboard
        </a>
        to track more metrics.
      {:else}
        <a
          class="text-fg-default underline underline-offset-2"
          href="mailto:logdash.contact@gmail.com"
        >
          Contact us
        </a>
        to track more metrics in this service.
      {/if}
    </div>
  {/if}
</MetricsColumn>
