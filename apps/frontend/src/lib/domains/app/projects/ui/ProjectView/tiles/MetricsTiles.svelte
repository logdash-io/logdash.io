<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { metricsState } from '$lib/domains/app/projects/application/metrics.state.svelte.js';
  import { MetricsService } from '$lib/domains/app/projects/infrastructure/metrics.service.js';
  import { projectsState } from '$lib/domains/app/projects/application/projects.state.svelte.js';
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
  const activeMetricId = $derived(page.params.metric_id);
  const showApp = $derived(projectsState.appNames.length > 1);

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
      app: showApp ? metric.app : undefined,
      value: metric.value,
      samples: [...(histories[metric.id] ?? []), metric.value],
      href: clusterId
        ? resolve('/app/domains/[cluster_id]/metrics/[metric_id]', {
            cluster_id: clusterId,
            metric_id: metric.id,
          })
        : undefined,
      active: metric.id === activeMetricId,
    })),
  );
  const fullApps = $derived(
    appsAtLimit(exposedConfigState.maxRegisteredMetrics(userState.tier)),
  );
  const upgradeMultiplier = $derived(
    exposedConfigState.maxRegisteredMetrics(UserTier.EARLY_BIRD) /
      exposedConfigState.maxRegisteredMetrics(userState.tier),
  );

  $effect(() => {
    const ids = metricIds ? metricIds.split(',') : [];
    const id = metricsState.clusterId;

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
              await MetricsService.readRecentMinutes(
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

  function appsAtLimit(limit: number): string[] {
    const counts: Record<string, number> = {};

    for (const { app } of metricsState.simplifiedMetrics) {
      counts[app] = (counts[app] ?? 0) + 1;
    }

    return Object.keys(counts).filter((app) => counts[app] >= limit);
  }
</script>

<svelte:document bind:visibilityState />

<MetricsColumn
  {metrics}
  tracked={metrics.length}
  loading={!metricsState.ready}
  {onNewMetric}
>
  {#if setupOpen && clusterId}
    <div class="flex flex-col items-start gap-3 px-3 pt-1 pb-2">
      <span class="text-fg-tertiary text-sm">
        Copy the prompt into your AI assistant to start sending metrics.
      </span>
      <SdkSetupPrompt {clusterId} feature={Feature.METRICS} />
    </div>
  {/if}

  {#if fullApps.length}
    <div class="text-fg-muted px-3 pb-2 text-sm">
      {showApp ? fullApps.join(', ') : 'This app'}
      {fullApps.length === 1 ? 'tracks' : 'track'} as many metrics as your plan allows.
      {#if userState.canUpgrade}
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
        to track more metrics in one app.
      {/if}
    </div>
  {/if}
</MetricsColumn>
