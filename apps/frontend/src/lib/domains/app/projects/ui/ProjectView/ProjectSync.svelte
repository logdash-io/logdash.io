<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { logsState } from '$lib/domains/logs/application/logs.state.svelte.js';
  import { createLogger } from '$lib/domains/shared/logger';
  import { getContext, untrack, type Snippet } from 'svelte';
  import { metricsState } from '$lib/domains/app/projects/application/metrics.state.svelte.js';
  import { cubicInOut } from 'svelte/easing';
  import { fade, fly } from 'svelte/transition';
  import { monitoringState } from '../../application/monitoring.state.svelte.js';

  type Props = {
    children: Snippet;
  };
  const { children }: Props = $props();

  const logger = createLogger('ProjectView');
  const previewedMetricId = $derived(page.params.metric_id);
  const clusterId = $derived(page.params.cluster_id);
  const projectIdToSync = $derived.by(() => {
    const id = page.params.project_id;

    if (!id) {
      logger.error('Synchronization failed due to missing projectId');
      return null;
    }
    return id;
  });

  const tabId = getContext<string>('tabId');

  let isPageVisible = $state(
    typeof document === 'undefined' ? true : !document.hidden,
  );

  const handleVisibilityChange = () => {
    const newVisibility = !document.hidden;
    let timeout;
    if (isPageVisible !== newVisibility) {
      if (newVisibility) {
        logger.info('Page became visible. Data sync will resume.');
        Promise.all([
          logsState.resumeSync(),
          metricsState.resumeSync(projectIdToSync, tabId),
          previewedMetricId
            ? metricsState.previewMetric(projectIdToSync, previewedMetricId)
            : Promise.resolve(),
          monitoringState.reloadAllPingBuckets(),
        ])
          .then(() => {
            isPageVisible = newVisibility;
          })
          .catch((error) => {
            // toast.error('Error resuming data sync:', error);
          });
      } else {
        clearTimeout(timeout);
        logger.info('Page became hidden. Data sync will be paused.');
        logsState.pauseSync();
        metricsState.pauseSync();
        isPageVisible = newVisibility;
      }
    }
  };

  $effect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    // Ensure the initial state is correctly set after client-side hydration
    isPageVisible = !document.hidden;

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  });

  $effect(() => {
    if (
      previewedMetricId &&
      metricsState.ready &&
      !metricsState.getById(previewedMetricId)
    ) {
      goto(`/app/clusters/${clusterId}/${projectIdToSync}/metrics`);
    }
  });

  $effect(() => {
    if (!projectIdToSync) {
      logger.error('Synchronization failed due to missing projectId');
      return;
    }

    if (!tabId) {
      logger.error('Synchronization failed due to missing tabId');
    }

    // todo check if project has enabled features before syncing
    logger.info(
      `Syncing data for project ${projectIdToSync} on tab ${tabId}. Page is visible.`,
    );
    untrack(() => metricsState.sync(projectIdToSync, tabId));

    return () => {
      logger.info(
        `Unsyncing data for project ${projectIdToSync} on tab ${tabId}.`,
      );
      metricsState.unsync();
    };
  });
</script>

<div class="flex w-full max-w-full flex-col gap-1.5 pb-8 md:flex-row">
  {#if !isPageVisible}
    <div
      in:fade={{ duration: 200, easing: cubicInOut }}
      out:fade={{ delay: 300, duration: 200, easing: cubicInOut }}
      class="bg-base-300/40 absolute top-0 left-0 z-20 h-full w-full backdrop-blur-xs"
    ></div>

    <div
      class="bg-secondary text-secondary-content fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full px-3 py-2 shadow-lg md:bottom-8"
      in:fly={{ duration: 200, easing: cubicInOut, y: 50 }}
      out:fly={{ delay: 300, duration: 200, easing: cubicInOut, y: 50 }}
    >
      <div class="flex items-center gap-2 text-sm font-medium">
        <div class="loading loading-spinner loading-xs"></div>
        <span>Updating...</span>
      </div>
    </div>
  {/if}

  {@render children?.()}
</div>
