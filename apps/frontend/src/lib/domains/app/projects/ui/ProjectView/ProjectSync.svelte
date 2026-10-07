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

  function onVisibilityChange(): void {
    const newVisibility = !document.hidden;
    if (isPageVisible !== newVisibility) {
      if (newVisibility) {
        logger.info('Page became visible. Data sync will resume.');
        void resumeSync();
      } else {
        logger.info('Page became hidden. Data sync will be paused.');
        logsState.pauseSync();
        metricsState.pauseSync();
        isPageVisible = newVisibility;
      }
    }
  }

  async function resumeSync(): Promise<void> {
    const projectId = projectIdToSync;

    try {
      await Promise.all([
        logsState.resumeSync(),
        projectId
          ? metricsState.resumeSync(projectId, tabId)
          : Promise.resolve(),
        projectId && previewedMetricId
          ? metricsState.previewMetric(projectId, previewedMetricId)
          : Promise.resolve(),
      ]);
      isPageVisible = true;
    } catch (error) {
      logger.error('Failed to resume data sync', error);
    }
  }

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
      previewedMetricId &&
      metricsState.ready &&
      !metricsState.getById(previewedMetricId) &&
      clusterId &&
      projectIdToSync
    ) {
      void goto(
        resolve('/app/domains/[cluster_id]/[project_id]/metrics', {
          cluster_id: clusterId,
          project_id: projectIdToSync,
        }),
      );
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

    logger.info(
      `Syncing data for project ${projectIdToSync} on tab ${tabId}. Page is visible.`,
    );
    void untrack(() => metricsState.sync(projectIdToSync, tabId));

    return () => {
      logger.info(
        `Unsyncing data for project ${projectIdToSync} on tab ${tabId}.`,
      );
      metricsState.unsync();
    };
  });
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
