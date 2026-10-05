<script lang="ts">
  import { logsState } from '$lib/domains/logs/application/logs.state.svelte.js';
  import { logPreviewState } from '$lib/domains/logs/application/log-preview.state.svelte.js';
  import type { Log } from '$lib/domains/logs/domain/log';
  import { intersect } from '$lib/domains/shared/ui/actions/use-intersect.svelte.js';
  import { filtersStore } from '../../infrastructure/filters.store.svelte.js';
  import { timeDisplayState } from '../../infrastructure/time-display.state.svelte.js';
  import LogRow from './log-row/LogRow.svelte';
  import LogPreviewDrawer from './LogPreviewDrawer.svelte';
  import EmptyState from '$lib/domains/shared/ui/components/EmptyState.svelte';
  import LoadingLine from '$lib/domains/shared/ui/components/LoadingLine.svelte';
  import {
    Button,
    ScrollArea,
    Spinner,
  } from '@logdash/hyper-ui/presentational';
  import { fade } from 'svelte/transition';

  type Props = {
    logs: Log[];
    rendered: boolean;
  };

  const { logs, rendered }: Props = $props();

  const filtered = $derived(
    Boolean(
      filtersStore.searchString.trim() ||
        filtersStore.endDate ||
        filtersStore.levels.length > 0 ||
        filtersStore.namespaces.length > 0,
    ),
  );
  const loading = $derived(
    logs.length === 0 && (logsState.fetchingLogs || logsState.pageIsLoading),
  );

  const ROW_HEIGHT = 28;
  const BUFFER_COUNT = 15;

  let visibleStartIndex = $state(0);
  let visibleEndIndex = $state(50);
  let containerHeight = $state(690);
  let viewportRef = $state<HTMLDivElement | null>(null);
  let scrolledFromTop = $state(false);

  let scrollRafId: number | null = null;
  let lastScrollTop = 0;
  let previousFirstLogId: string | null = null;
  let previousLogCount = 0;
  let scrollToSelectedDebounceId: ReturnType<typeof setTimeout> | null = null;
  const AUTO_SCROLL_DEBOUNCE_MS = 150;

  let newLogsCount = $state(0);

  const totalHeight = $derived(logs.length * ROW_HEIGHT);

  function calculateVisibleRange(scrollTop: number): {
    start: number;
    end: number;
  } {
    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / ROW_HEIGHT) - BUFFER_COUNT,
    );
    const visibleCount = Math.ceil(containerHeight / ROW_HEIGHT);
    const endIndex = Math.min(
      logs.length,
      startIndex + visibleCount + BUFFER_COUNT * 2,
    );

    return { start: startIndex, end: endIndex };
  }

  const visibleLogs = $derived.by(() => {
    const start = visibleStartIndex;
    const end = Math.min(visibleEndIndex, logs.length);

    const result: { log: Log; index: number; translateY: number }[] = [];

    for (let i = start; i < end; i++) {
      const log = logs[i];
      if (log) {
        result.push({
          log,
          index: i,
          translateY: i * ROW_HEIGHT,
        });
      }
    }

    return result;
  });

  function onScroll(event: Event): void {
    const target = event.currentTarget as HTMLDivElement;
    if (!target) return;

    const newScrollTop = target.scrollTop;
    scrolledFromTop = newScrollTop > 0;

    if (scrollRafId !== null) return;

    scrollRafId = requestAnimationFrame(() => {
      scrollRafId = null;

      const { start, end } = calculateVisibleRange(newScrollTop);

      if (start !== visibleStartIndex || end !== visibleEndIndex) {
        visibleStartIndex = start;
        visibleEndIndex = end;
      }

      lastScrollTop = newScrollTop;
    });
  }

  let loadNextPagePending = false;

  async function loadNextPage(): Promise<void> {
    if (logsState.pageIsLoading || loadNextPagePending) return;
    loadNextPagePending = true;
    try {
      await logsState.loadNextPage();
    } finally {
      loadNextPagePending = false;
    }
  }

  function onIntersect({ isIntersecting }: IntersectionObserverEntry): void {
    if (isIntersecting) {
      void loadNextPage();
    }
  }

  function onLogClick(log: Log): void {
    logPreviewState.toggle(log);
  }

  $effect(() => {
    if (viewportRef) {
      containerHeight = viewportRef.clientHeight;

      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          containerHeight = entry.contentRect.height;
        }
      });

      resizeObserver.observe(viewportRef);

      return () => {
        resizeObserver.disconnect();
        if (scrollRafId !== null) {
          cancelAnimationFrame(scrollRafId);
        }
      };
    }
  });

  $effect(() => {
    if (!viewportRef || logs.length === 0) {
      previousFirstLogId = logs[0]?.id ?? null;
      previousLogCount = logs.length;
      newLogsCount = !rendered ? logs.length : 0;
      return;
    }

    const newItemsAdded = logs.length > previousLogCount;
    const wasScrolledFromTop = lastScrollTop > 0;
    const drawerIsOpen = logPreviewState.isOpen;

    let addedCount = 0;

    if (newItemsAdded && previousFirstLogId) {
      const previousFirstLogIndex = logs.findIndex(
        (l) => l.id === previousFirstLogId,
      );

      if (previousFirstLogIndex > 0) {
        addedCount = previousFirstLogIndex;
        const addedHeight = previousFirstLogIndex * ROW_HEIGHT;

        if (addedHeight > 0 && (wasScrolledFromTop || drawerIsOpen)) {
          viewportRef.scrollTop = lastScrollTop + addedHeight;
          lastScrollTop = viewportRef.scrollTop;
          scrolledFromTop = lastScrollTop > 0;
        }
      }
    }

    newLogsCount = !rendered ? logs.length : addedCount;
    previousFirstLogId = logs[0]?.id ?? null;
    previousLogCount = logs.length;

    const { start, end } = calculateVisibleRange(lastScrollTop);
    visibleStartIndex = start;
    visibleEndIndex = end;
  });

  $effect(() => {
    logPreviewState.setLogs(logs);
  });

  $effect(() => {
    const selectedLog = logPreviewState.selectedLog;
    if (!selectedLog || !viewportRef || !logPreviewState.isOpen) {
      if (scrollToSelectedDebounceId) {
        clearTimeout(scrollToSelectedDebounceId);
        scrollToSelectedDebounceId = null;
      }
      return;
    }

    if (scrollToSelectedDebounceId) {
      clearTimeout(scrollToSelectedDebounceId);
    }

    scrollToSelectedDebounceId = setTimeout(() => {
      scrollToSelectedDebounceId = null;
      if (!viewportRef || !logPreviewState.selectedLog) return;

      const selectedIndex = logPreviewState.currentIndex;
      if (selectedIndex === -1) return;

      const rowTop = selectedIndex * ROW_HEIGHT;
      const rowBottom = rowTop + ROW_HEIGHT;
      const viewportTop = viewportRef.scrollTop;
      const viewportBottom = viewportTop + containerHeight;

      const drawerHeight = containerHeight * 0.6;
      const visibleAreaBottom = viewportBottom - drawerHeight;

      if (rowTop < viewportTop) {
        viewportRef.scrollTop = rowTop;
        lastScrollTop = viewportRef.scrollTop;
        scrolledFromTop = lastScrollTop > 0;

        const { start, end } = calculateVisibleRange(lastScrollTop);
        visibleStartIndex = start;
        visibleEndIndex = end;
      } else if (rowBottom > visibleAreaBottom) {
        viewportRef.scrollTop = rowBottom - (containerHeight - drawerHeight);
        lastScrollTop = viewportRef.scrollTop;
        scrolledFromTop = lastScrollTop > 0;

        const { start, end } = calculateVisibleRange(lastScrollTop);
        visibleStartIndex = start;
        visibleEndIndex = end;
      }
    }, AUTO_SCROLL_DEBOUNCE_MS);
  });
</script>

<div class="relative flex min-h-96 flex-1 flex-col">
  {#if scrolledFromTop}
    <div
      class="from-surface-50-bg pointer-events-none absolute inset-x-0 top-0 z-10 h-6 bg-gradient-to-b to-transparent"
    ></div>
  {/if}

  <div class="absolute inset-0">
    <ScrollArea class="h-full" onscroll={onScroll} bind:viewportRef>
      {#if logs.length === 0}
        {#if loading}
          <div class="px-4 pb-4">
            <LoadingLine label="Loading logs" />
          </div>
        {:else if logsState.fetchFailed}
          <EmptyState
            class="px-4 pb-4"
            title="Could not load logs"
            description="Check your connection and try again."
          >
            <Button size="sm" onclick={() => logsState.retry()}>Retry</Button>
          </EmptyState>
        {:else if filtered}
          <EmptyState
            class="px-4 pb-4"
            title="No matching logs"
            description="Nothing matches this search and these filters."
          >
            <Button size="sm" onclick={() => filtersStore.reset()}>
              Reset filters
            </Button>
          </EmptyState>
        {:else}
          <EmptyState
            class="px-4 pb-4"
            title="No logs yet"
            description="New logs show up here as your app sends them."
          />
        {/if}
      {/if}

      <div class="relative" style="height: {totalHeight}px;">
        {#each visibleLogs as { log, index, translateY } (log.id)}
          {@const shouldAnimate = index < newLogsCount}
          {@const animationDelay = !rendered ? index * 5 : 0}
          <div
            class="absolute inset-x-0"
            style="transform: translate3d(0, {translateY}px, 0);"
            in:fade|global={{
              duration: shouldAnimate ? 300 : 0,
              delay: animationDelay,
            }}
          >
            <LogRow
              date={log.createdAt}
              level={log.level}
              message={log.message}
              namespace={log.namespace}
              prefix={timeDisplayState.isRelative ? 'relative' : 'full'}
              selected={logPreviewState.selectedLog?.id === log.id}
              onclick={() => onLogClick(log)}
            />
          </div>
        {/each}

        <div
          class="absolute inset-x-0 h-0.5"
          style="top: {totalHeight - 1}px;"
          use:intersect={{ callback: onIntersect }}
        ></div>
      </div>

      {#if logs.length > 0 && logsState.pageIsLoading}
        <div class="flex h-12 shrink-0 items-center px-4">
          <Spinner size="sm" aria-hidden="true" />
        </div>
      {/if}
    </ScrollArea>
  </div>

  <div
    class="from-surface-50-bg pointer-events-none absolute inset-x-0 bottom-0 z-10 h-6 bg-gradient-to-t to-transparent"
  ></div>

  <LogPreviewDrawer />
</div>
