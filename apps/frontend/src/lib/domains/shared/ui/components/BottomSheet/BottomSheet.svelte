<script lang="ts">
  import { browser } from '$app/environment';
  import { afterNavigate } from '$app/navigation';
  import { bottomSheetState } from './bottom-sheet.state.svelte.js';
  import type { Snippet } from 'svelte';

  type Props = {
    children: Snippet;
    peekContent: () => ReturnType<Snippet>;
  };
  const { children, peekContent }: Props = $props();

  let sheetElement: HTMLDivElement | null = $state(null);
  let dragStartY = $state(0);
  let currentDragY = $state(0);
  let isDragging = $state(false);
  let dragStartTime = $state(0);

  const PEEK_HEIGHT = 64;
  const DRAG_THRESHOLD = 80;
  const VELOCITY_THRESHOLD = 0.4;

  const maxDragDistance = $derived.by(() => {
    if (!browser) return 500;
    return window.innerHeight * 0.85 - PEEK_HEIGHT;
  });

  const clampedDragY = $derived.by(() => {
    if (bottomSheetState.isOpen) {
      return Math.max(0, Math.min(currentDragY, maxDragDistance));
    } else {
      return Math.max(-maxDragDistance, Math.min(currentDragY, 0));
    }
  });

  const openProgress = $derived.by(() => {
    if (!isDragging) {
      return bottomSheetState.isOpen ? 1 : 0;
    }

    if (bottomSheetState.isOpen) {
      return 1 - Math.min(1, clampedDragY / maxDragDistance);
    } else {
      return Math.min(1, -clampedDragY / maxDragDistance);
    }
  });

  const sheetStyle = $derived.by(() => {
    const closedTranslate = maxDragDistance;

    if (!isDragging) {
      if (bottomSheetState.isOpen) {
        return 'transform: translateY(0)';
      } else {
        return `transform: translateY(${closedTranslate}px)`;
      }
    }

    if (bottomSheetState.isOpen) {
      const dragOffset = Math.max(0, Math.min(clampedDragY, maxDragDistance));
      return `transform: translateY(${dragOffset}px)`;
    } else {
      const dragOffset = Math.max(0, maxDragDistance + clampedDragY);
      return `transform: translateY(${dragOffset}px)`;
    }
  });

  const backdropOpacity = $derived(openProgress * 0.7);
  const showContent = $derived(openProgress > 0);
  const peekOpacity = $derived(1 - openProgress);
  const contentOpacity = $derived(openProgress);

  function onTouchStart(e: TouchEvent): void {
    const touch = e.touches[0];
    dragStartY = touch.clientY;
    currentDragY = 0;
    isDragging = true;
    dragStartTime = Date.now();
  }

  function onTouchMove(e: TouchEvent): void {
    if (!isDragging) return;
    const touch = e.touches[0];
    currentDragY = touch.clientY - dragStartY;
  }

  function onTouchEnd(): void {
    if (!isDragging) return;

    const duration = Date.now() - dragStartTime;
    const velocity = Math.abs(currentDragY) / duration;
    const movedEnough = Math.abs(currentDragY) > DRAG_THRESHOLD;
    const fastEnough = velocity > VELOCITY_THRESHOLD;

    if (bottomSheetState.isOpen) {
      if ((movedEnough || fastEnough) && currentDragY > 0) {
        bottomSheetState.close();
      }
    } else {
      if ((movedEnough || fastEnough) && currentDragY < 0) {
        bottomSheetState.open();
      }
    }

    isDragging = false;
    currentDragY = 0;
  }

  function onPeekClick(): void {
    bottomSheetState.toggle();
  }

  function onBackdropClick(): void {
    bottomSheetState.close();
  }

  function onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && bottomSheetState.isOpen) {
      bottomSheetState.close();
    }
  }

  afterNavigate(() => {
    bottomSheetState.close();
  });

  $effect(() => {
    if (bottomSheetState.isOpen || (isDragging && openProgress > 0.5)) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  });
</script>

<svelte:window onkeydown={onKeyDown} />

<div class="fixed inset-0 z-40 pointer-events-none lg:hidden">
  {#if showContent || bottomSheetState.isOpen}
    <button
      class={[
        'absolute inset-0 bg-black pointer-events-auto',
        { 'transition-opacity duration-300 ease-out': !isDragging },
      ]}
      style="opacity: {backdropOpacity}"
      onclick={onBackdropClick}
      aria-label="Close menu"
    ></button>
  {/if}

  <div
    bind:this={sheetElement}
    class={[
      'absolute inset-x-0 bottom-0 flex flex-col ld-card-bg rounded-t-3xl ld-card-border shadow-2xl pointer-events-auto',
      { 'transition-transform duration-300 ease-out': !isDragging },
    ]}
    style="height: 85dvh; {sheetStyle}"
    ontouchstart={onTouchStart}
    ontouchmove={onTouchMove}
    ontouchend={onTouchEnd}
    role="dialog"
    aria-modal={bottomSheetState.isOpen}
  >
    <button
      class="flex w-full cursor-pointer flex-col items-center pt-2 pb-1"
      onclick={onPeekClick}
      aria-label={bottomSheetState.isOpen ? 'Close menu' : 'Open menu'}
    >
      <div class="h-1 w-10 rounded-full bg-base-content/20"></div>
      <div
        class={[
          'grid w-full',
          {
            'transition-[grid-template-rows] duration-300 ease-out':
              !isDragging,
          },
        ]}
        style="grid-template-rows: {peekOpacity}fr"
      >
        <div class="overflow-hidden">
          {@render peekContent()}
        </div>
      </div>
    </button>

    <div
      class={[
        'flex flex-1 flex-col overflow-y-auto overscroll-contain px-4 pb-2',
        { 'transition-opacity duration-300': !isDragging },
      ]}
      style="opacity: {contentOpacity}"
    >
      {@render children()}
    </div>
  </div>
</div>
