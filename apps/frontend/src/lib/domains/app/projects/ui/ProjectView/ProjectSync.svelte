<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { logMetricsState } from '$lib/domains/app/projects/application/log-metrics.state.svelte.js';
  import { logsState } from '$lib/domains/app/projects/application/logs.state.svelte.js';
  import { createLogger } from '$lib/domains/shared/logger';
  import { getContext, untrack, type Snippet } from 'svelte';
  import { metricsState } from '$lib/domains/app/projects/application/metrics.state.svelte.js';
  import { cubicInOut } from 'svelte/easing';
  import { fade, fly } from 'svelte/transition';

  type Props = {
    children: Snippet;
  };
  const { children }: Props = $props();

  const logger = createLogger('ProjectView');
  const previewedMetricId = $derived(page.url.searchParams.get('metric_id'));
  const projectIdToSync = $derived.by(() => {
    const id = page.url.searchParams.get('project_id');

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
            logsState.resumeSync(projectIdToSync, tabId),
            logMetricsState.resumeSync(projectIdToSync, tabId),
            metricsState.resumeSync(projectIdToSync, tabId),
            previewedMetricId
              ? metricsState.previewMetric(projectIdToSync, previewedMetricId)
              : Promise.resolve(),
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
        logMetricsState.pauseSync();
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
      page.url.searchParams.delete('metric_id');
      goto(page.url.href);
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
    untrack(() => logsState.sync(projectIdToSync, tabId));
    untrack(() => logMetricsState.sync(projectIdToSync, tabId));

    return () => {
      logger.info(
        `Unsyncing data for project ${projectIdToSync} on tab ${tabId}.`,
      );
      metricsState.unsync();
      logsState.unsync();
      logMetricsState.unsync();
    };
  });
</script>

<div class="flex w-full max-w-full flex-col gap-4 pb-8 sm:flex-row">
  {#if !isPageVisible}
    <div
      in:fade={{ duration: 200, easing: cubicInOut }}
      out:fade={{ delay: 300, duration: 200, easing: cubicInOut }}
      class="bg-base-300/40 absolute top-0 left-0 z-20 h-full w-full backdrop-blur-xs"
    ></div>

    <div
      class="bg-secondary text-secondary-content fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg px-3 py-2 shadow-lg sm:bottom-8"
      in:fly={{ duration: 200, easing: cubicInOut, y: 50 }}
      out:fly={{ delay: 300, duration: 200, easing: cubicInOut, y: 50 }}
    >
      <div class="flex items-center gap-2">
        <div class="loading loading-spinner loading-sm"></div>
        <span>Resuming data sync...</span>
      </div>
    </div>
  {/if}

  {@render children?.()}
</div>
