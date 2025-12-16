<script lang="ts">
  import type { ScrollAreaProps } from "./ScrollArea.types";

  let {
    class: className = "",
    scrollbarClass = "",
    orientation = "y",
    autoHideDelay = 1000,
    thumbMinSize = 40,
    viewportRef = $bindable(null),
    onscroll,
    children,
  }: ScrollAreaProps = $props();

  let viewport = $state<HTMLDivElement | null>(null);

  $effect(() => {
    viewportRef = viewport;
  });
  let verticalThumb = $state<HTMLDivElement | null>(null);
  let horizontalThumb = $state<HTMLDivElement | null>(null);

  let showVertical = $state(false);
  let showHorizontal = $state(false);
  let hideTimeoutY: ReturnType<typeof setTimeout> | null = null;
  let hideTimeoutX: ReturnType<typeof setTimeout> | null = null;

  let isDraggingY = $state(false);
  let isDraggingX = $state(false);
  let dragStartY = 0;
  let dragStartX = 0;
  let dragStartScrollTop = 0;
  let dragStartScrollLeft = 0;

  let thumbYHeight = $state(0);
  let thumbYTop = $state(0);
  let thumbXWidth = $state(0);
  let thumbXLeft = $state(0);

  let hasVerticalScroll = $state(false);
  let hasHorizontalScroll = $state(false);

  function updateScrollbars() {
    if (!viewport) return;

    const {
      scrollTop,
      scrollLeft,
      scrollHeight,
      scrollWidth,
      clientHeight,
      clientWidth,
    } = viewport;

    hasVerticalScroll = scrollHeight > clientHeight;
    hasHorizontalScroll = scrollWidth > clientWidth;

    if (hasVerticalScroll && (orientation === "y" || orientation === "xy")) {
      const trackHeight = clientHeight;
      const thumbHeight = Math.max(
        thumbMinSize,
        (clientHeight / scrollHeight) * trackHeight
      );
      const maxScrollTop = scrollHeight - clientHeight;
      const scrollRatio = maxScrollTop > 0 ? scrollTop / maxScrollTop : 0;
      const maxThumbTop = trackHeight - thumbHeight;

      thumbYHeight = thumbHeight;
      thumbYTop = scrollRatio * maxThumbTop;
    }

    if (hasHorizontalScroll && (orientation === "x" || orientation === "xy")) {
      const trackWidth = clientWidth;
      const thumbWidth = Math.max(
        thumbMinSize,
        (clientWidth / scrollWidth) * trackWidth
      );
      const maxScrollLeft = scrollWidth - clientWidth;
      const scrollRatio = maxScrollLeft > 0 ? scrollLeft / maxScrollLeft : 0;
      const maxThumbLeft = trackWidth - thumbWidth;

      thumbXWidth = thumbWidth;
      thumbXLeft = scrollRatio * maxThumbLeft;
    }
  }

  function handleScroll(event: Event) {
    updateScrollbars();

    if (hasVerticalScroll && (orientation === "y" || orientation === "xy")) {
      showVertical = true;
      if (hideTimeoutY) clearTimeout(hideTimeoutY);
      hideTimeoutY = setTimeout(() => {
        if (!isDraggingY) showVertical = false;
      }, autoHideDelay);
    }

    if (hasHorizontalScroll && (orientation === "x" || orientation === "xy")) {
      showHorizontal = true;
      if (hideTimeoutX) clearTimeout(hideTimeoutX);
      hideTimeoutX = setTimeout(() => {
        if (!isDraggingX) showHorizontal = false;
      }, autoHideDelay);
    }

    onscroll?.(event);
  }

  function handleVerticalTrackClick(e: MouseEvent) {
    if (!viewport || e.target !== e.currentTarget) return;

    const trackRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clickY = e.clientY - trackRect.top;
    const trackHeight = trackRect.height;
    const { scrollHeight, clientHeight } = viewport;
    const maxScrollTop = scrollHeight - clientHeight;
    const scrollRatio = clickY / trackHeight;

    viewport.scrollTop = scrollRatio * maxScrollTop;
  }

  function handleHorizontalTrackClick(e: MouseEvent) {
    if (!viewport || e.target !== e.currentTarget) return;

    const trackRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clickX = e.clientX - trackRect.left;
    const trackWidth = trackRect.width;
    const { scrollWidth, clientWidth } = viewport;
    const maxScrollLeft = scrollWidth - clientWidth;
    const scrollRatio = clickX / trackWidth;

    viewport.scrollLeft = scrollRatio * maxScrollLeft;
  }

  function handleVerticalThumbPointerDown(e: PointerEvent) {
    e.preventDefault();
    isDraggingY = true;
    dragStartY = e.clientY;
    dragStartScrollTop = viewport.scrollTop;

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handleVerticalThumbPointerMove(e: PointerEvent) {
    if (!isDraggingY) return;

    const deltaY = e.clientY - dragStartY;
    const { scrollHeight, clientHeight } = viewport;
    const trackHeight = clientHeight;
    const thumbHeight = thumbYHeight;
    const maxThumbTop = trackHeight - thumbHeight;
    const maxScrollTop = scrollHeight - clientHeight;
    const scrollDelta = (deltaY / maxThumbTop) * maxScrollTop;

    viewport.scrollTop = dragStartScrollTop + scrollDelta;
  }

  function handleVerticalThumbPointerUp(e: PointerEvent) {
    isDraggingY = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    hideTimeoutY = setTimeout(() => {
      showVertical = false;
    }, autoHideDelay);
  }

  function handleHorizontalThumbPointerDown(e: PointerEvent) {
    e.preventDefault();
    isDraggingX = true;
    dragStartX = e.clientX;
    dragStartScrollLeft = viewport.scrollLeft;

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handleHorizontalThumbPointerMove(e: PointerEvent) {
    if (!isDraggingX) return;

    const deltaX = e.clientX - dragStartX;
    const { scrollWidth, clientWidth } = viewport;
    const trackWidth = clientWidth;
    const thumbWidth = thumbXWidth;
    const maxThumbLeft = trackWidth - thumbWidth;
    const maxScrollLeft = scrollWidth - clientWidth;
    const scrollDelta = (deltaX / maxThumbLeft) * maxScrollLeft;

    viewport.scrollLeft = dragStartScrollLeft + scrollDelta;
  }

  function handleHorizontalThumbPointerUp(e: PointerEvent) {
    isDraggingX = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    hideTimeoutX = setTimeout(() => {
      showHorizontal = false;
    }, autoHideDelay);
  }

  $effect(() => {
    if (viewport) {
      updateScrollbars();

      const resizeObserver = new ResizeObserver(() => {
        updateScrollbars();
      });

      resizeObserver.observe(viewport);

      const mutationObserver = new MutationObserver(() => {
        updateScrollbars();
      });

      mutationObserver.observe(viewport, {
        childList: true,
        subtree: true,
        characterData: true,
      });

      return () => {
        resizeObserver.disconnect();
        mutationObserver.disconnect();
        if (hideTimeoutY) clearTimeout(hideTimeoutY);
        if (hideTimeoutX) clearTimeout(hideTimeoutX);
      };
    }
  });
</script>

<div class="scroll-area-root relative overflow-hidden {className}">
  <div
    bind:this={viewport}
    class="scroll-area-viewport z-0 h-full w-full overflow-auto"
    onscroll={handleScroll}
  >
    {@render children()}
  </div>

  {#if (orientation === "y" || orientation === "xy") && hasVerticalScroll}
    <div
      class={[
        "z-top scroll-area-scrollbar-y absolute right-0 top-0 bottom-0 w-2 transition-opacity duration-200",
        scrollbarClass,
        {
          "opacity-0 hover:opacity-100": !showVertical,
          "opacity-100": showVertical,
        },
      ]}
      onclick={handleVerticalTrackClick}
      role="scrollbar"
      aria-orientation="vertical"
      aria-valuenow={viewport?.scrollTop ?? 0}
      tabindex={-1}
    >
      <div
        bind:this={verticalThumb}
        class="z-top scroll-area-thumb absolute right-0.5 w-1.5 rounded-full bg-neutral-500 transition-colors hover:bg-neutral-400 cursor-pointer"
        style="height: {thumbYHeight}px; top: {thumbYTop}px;"
        onpointerdown={handleVerticalThumbPointerDown}
        onpointermove={handleVerticalThumbPointerMove}
        onpointerup={handleVerticalThumbPointerUp}
        role="slider"
        aria-valuenow={viewport?.scrollTop ?? 0}
        tabindex={-1}
      ></div>
    </div>
  {/if}

  {#if (orientation === "x" || orientation === "xy") && hasHorizontalScroll}
    <div
      class="z-top scroll-area-scrollbar-x absolute bottom-0 left-0 right-0 h-2 transition-opacity duration-200 {scrollbarClass}"
      class:opacity-0={!showHorizontal}
      class:opacity-100={showHorizontal}
      onclick={handleHorizontalTrackClick}
      role="scrollbar"
      aria-orientation="horizontal"
      aria-valuenow={viewport?.scrollLeft ?? 0}
      tabindex={-1}
    >
      <div
        bind:this={horizontalThumb}
        class="scroll-area-thumb absolute bottom-0.5 h-1.5 rounded-full bg-neutral-500 transition-colors hover:bg-neutral-400 cursor-pointer"
        style="width: {thumbXWidth}px; left: {thumbXLeft}px;"
        onpointerdown={handleHorizontalThumbPointerDown}
        onpointermove={handleHorizontalThumbPointerMove}
        onpointerup={handleHorizontalThumbPointerUp}
        role="slider"
        aria-valuenow={viewport?.scrollLeft ?? 0}
        tabindex={-1}
      ></div>
    </div>
  {/if}
</div>

<style>
  .scroll-area-viewport {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .scroll-area-viewport::-webkit-scrollbar {
    display: none;
  }
</style>
