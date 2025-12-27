<script lang="ts">
  import { logsState } from '$lib/domains/logs/application/logs.state.svelte.js';
  import { logPreviewState } from '$lib/domains/logs/application/log-preview.state.svelte.js';
  import type { Log } from '$lib/domains/logs/domain/log';
  import { intersect } from '$lib/domains/shared/ui/actions/use-intersect.svelte.js';
  import { filtersStore } from '../../infrastructure/filters.store.svelte.js';
  import EnhancedLogRow from './log-row/LogRow.svelte';
  import LogPreviewDrawer from './LogPreviewDrawer.svelte';
  import { ScrollArea } from '@logdash/hyper-ui/presentational';
  import { fade } from 'svelte/transition';

  type Props = {
    logs: Log[];
    rendered: boolean;
  };

  const { logs, rendered }: Props = $props();

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
      loadNextPage();
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

<div
  class="relative flex h-full max-h-[690px] w-full max-w-full flex-1 flex-col"
>
  {#if scrolledFromTop}
    <div
      class="pointer-events-none absolute top-0 left-0 z-10 -mt-1 h-12 w-full bg-gradient-to-b from-base-200 to-transparent"
    ></div>
  {/if}

  <ScrollArea
    class="flex h-full max-h-full w-full flex-col gap-1.5 overflow-auto px-2 sm:gap-0 md:overscroll-contain"
    onscroll={onScroll}
    bind:viewportRef
  >
    {#if logs.length === 0 && logsState.hasFilters && !logsState.fetchingLogs}
      <div
        class="flex h-full w-full flex-col items-center justify-center gap-2 py-16"
      >
        <p class="text-base-content/40 text-sm">
          No logs found for the selected filters
        </p>
        <button
          class="btn btn-sm btn-secondary"
          onclick={() => {
            filtersStore.reset();
          }}
        >
          Reset filters
        </button>
      </div>
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
          <EnhancedLogRow
            {index}
            date={log.createdAt}
            level={log.level}
            message={log.message}
            namespace={log.namespace}
            isSelected={logPreviewState.selectedLog?.id === log.id}
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

    {#if logsState.pageIsLoading || logsState.fetchingLogs}
      <div class="flex h-12 shrink-0 items-center justify-center gap-2">
        <span class="loading loading-spinner loading-sm opacity-80"></span>
      </div>
    {/if}
  </ScrollArea>

  <div
    class="pointer-events-none absolute bottom-0 left-0 z-10 h-4 w-full bg-gradient-to-b from-transparent to-base-200"
  ></div>

  <LogPreviewDrawer />
</div>
