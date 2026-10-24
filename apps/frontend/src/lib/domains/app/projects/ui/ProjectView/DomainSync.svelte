<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { logsState } from '$lib/domains/logs/application/logs.state.svelte.js';
  import { createLogger } from '$lib/domains/shared/logger';
  import { Spinner } from '@logdash/hyper-ui/presentational';
  import { getContext, untrack, type Snippet } from 'svelte';
  import { metricsState } from '$lib/domains/app/projects/application/metrics.state.svelte.js';
  import { cubicInOut } from 'svelte/easing';
  import { fade, fly } from 'svelte/transition';

  type Props = {
    metrics?: boolean;
    children: Snippet;
  };
  const { metrics = false, children }: Props = $props();

  const logger = createLogger('DomainSync');
  const previewedMetricId = $derived(page.params.metric_id);
  const clusterId = $derived(page.params.cluster_id);
  const tabId = getContext<string>('tabId');

  let isPageVisible = $state(
    typeof document === 'undefined' ? true : !document.hidden,
  );

  $effect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    document.addEventListener('visibilitychange', onVisibilityChange);
    isPageVisible = !document.hidden;

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  });

  $effect(() => {
    if (
      metrics &&
      clusterId &&
      previewedMetricId &&
      metricsState.ready &&
      !metricsState.getById(previewedMetricId)
    ) {
      void goto(
        resolve('/app/domains/[cluster_id]/metrics', {
          cluster_id: clusterId,
        }),
      );
    }
  });

  $effect(() => {
    if (!metrics || !clusterId) {
      return;
    }

    const syncedClusterId = clusterId;
    void untrack(() => metricsState.sync(syncedClusterId, tabId));

    return () => {
      metricsState.unsync();
    };
  });

  function onVisibilityChange(): void {
    const visible = !document.hidden;

    if (isPageVisible === visible) {
      return;
    }

    if (visible) {
      void resumeSync();
      return;
    }

    logsState.pauseSync();
    metricsState.pauseSync();
    isPageVisible = false;
  }

  async function resumeSync(): Promise<void> {
    try {
      await Promise.all([
        logsState.resumeSync(),
        metrics && clusterId
          ? metricsState.resumeSync(clusterId, tabId)
          : Promise.resolve(),
        metrics && clusterId && previewedMetricId
          ? metricsState.previewMetric(clusterId, previewedMetricId)
          : Promise.resolve(),
      ]);
      isPageVisible = true;
    } catch (error) {
      logger.error('Failed to resume data sync', error);
    }
  }
</script>

<div class="relative flex w-full flex-1 flex-col">
  {#if !isPageVisible}
    <div
      in:fade={{ duration: 200, easing: cubicInOut }}
      out:fade={{ delay: 300, duration: 200, easing: cubicInOut }}
      class="bg-surface-root-bg/40 absolute top-0 left-0 z-20 h-full w-full backdrop-blur-xs"
    ></div>

    <div class="pointer-events-none absolute inset-0 z-30">
      <div
        class="sticky top-6 flex justify-center"
        in:fly={{ duration: 200, easing: cubicInOut, y: -16 }}
        out:fly={{ delay: 300, duration: 200, easing: cubicInOut, y: -16 }}
      >
        <span
          class="bg-surface-inverse-bg text-fg-inverse flex h-8 items-center gap-2 rounded-full px-3 text-sm font-medium shadow-lg"
          role="status"
        >
          <Spinner size="xs" aria-hidden="true" />
          Updating
        </span>
      </div>
    </div>
  {/if}

  {@render children?.()}
</div>
