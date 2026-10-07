<script lang="ts">
  import { anonymousPreviewState } from '$lib/domains/anonymous/application/anonymous-preview.state.svelte';
  import { Tooltip } from '@logdash/hyper-ui/presentational';
  import { Maximize2Icon, Minimize2Icon } from 'lucide-svelte';
  import { flushSync } from 'svelte';
  import { prefersReducedMotion } from 'svelte/motion';
  import { HERO_SHOWCASE_ID } from './hero-anchors';
  import HeroClaimCard from './HeroClaimCard.svelte';
  import HeroDashboard from './HeroDashboard.svelte';
  import { heroClaim } from './hero-claim.svelte';
  import { heroTakeover } from './hero-takeover.svelte';

  type FrameStyle = {
    inset: string;
    borderRadius: string;
    opacity: string;
    scale: string;
  };

  const EXPAND_MS = 550;
  const COLLAPSE_MS = 400;
  const REDUCED_MS = 150;
  const MORPH_EASING = 'cubic-bezier(0.32, 0.72, 0, 1)';
  const FRAME_RADIUS_PX = 12;
  const HIDDEN_SCALE = 0.96;
  const FADE_SPAN = 0.6;
  const WINDOW_BUTTON_CLASS =
    'text-fg-tertiary hover:text-fg-default hover:bg-surface-100-hover-bg focus-visible:outline-brand -mr-1.5 flex size-7 shrink-0 items-center justify-center rounded-md transition-ink duration-150 focus-visible:outline-2';
  const FULL_FRAME: FrameStyle = {
    inset: '0px',
    borderRadius: '0px',
    opacity: '1',
    scale: '1',
  };

  let dialog = $state<HTMLDialogElement | null>(null);
  let slot = $state<HTMLDivElement | null>(null);
  let toggleButton = $state<HTMLButtonElement | null>(null);
  let full = $state(false);
  let settled = $state(false);
  let target: 'inline' | 'full' = 'inline';
  let animations: Animation[] = [];

  const expanded = $derived(heroTakeover.expanded);
  const claimShown = $derived(expanded && settled && heroClaim.visible);

  const host = $derived.by(() => {
    const demoHost = anonymousPreviewState.demo.monitor?.name ?? '';

    return heroTakeover.available
      ? (anonymousPreviewState.previewHost ?? demoHost)
      : demoHost;
  });

  $effect.pre(() => {
    if (!slot || dialog?.open) {
      return;
    }

    slot.style.height = expanded ? `${slot.offsetHeight}px` : '';
  });

  $effect(() => {
    const next = expanded;
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) {
        return;
      }

      if (next) {
        void open();
      } else {
        void collapse();
      }
    });

    return () => {
      cancelled = true;
    };
  });

  $effect(() => {
    if (!expanded) {
      return;
    }

    const previous = document.title;
    const title = `${host} · Logdash`;
    document.title = title;

    return () => {
      if (document.title === title) {
        document.title = previous;
      }
    };
  });

  async function open(): Promise<void> {
    if (!dialog || target === 'full') {
      return;
    }

    target = 'full';
    const from = dialog.open ? currentFrame(dialog) : null;
    const backdropFrom = dialog.open ? backdropOpacity(dialog) : '0';
    const inline = dialog.getBoundingClientRect();

    stop();
    full = true;
    flushSync();

    if (!dialog.open) {
      dialog.showModal();
      dialog.focus({ preventScroll: true });
    }

    const box = dialog.getBoundingClientRect();
    const finished = await morph(
      from ?? restingFrame(inline, box),
      FULL_FRAME,
      [backdropFrom, '1'],
      EXPAND_MS,
    );

    if (!finished || target !== 'full') {
      return;
    }

    stop();
    settled = true;
  }

  async function collapse(): Promise<void> {
    if (!dialog || !slot || target === 'inline') {
      return;
    }

    target = 'inline';
    const from = currentFrame(dialog);
    const backdropFrom = backdropOpacity(dialog);

    stop();
    settled = false;

    dialog.close();
    full = false;
    slot.style.height = '';
    flushSync();

    const inline = dialog.getBoundingClientRect();
    slot.style.height = `${slot.offsetHeight}px`;
    full = true;
    flushSync();
    dialog.showModal();

    const box = dialog.getBoundingClientRect();
    const finishing = morph(
      from,
      restingFrame(inline, box),
      [backdropFrom, '0'],
      COLLAPSE_MS,
    );
    const unfollow =
      inView(inline) && !prefersReducedMotion.current
        ? followSlot(from, box)
        : null;
    const finished = await finishing;
    unfollow?.();

    if (!finished || target !== 'inline') {
      return;
    }

    dialog.close();
    full = false;
    slot.style.height = '';
    flushSync();
    stop();
  }

  async function morph(
    from: FrameStyle,
    to: FrameStyle,
    backdrop: [string, string],
    duration: number,
  ): Promise<boolean> {
    if (!dialog) {
      return false;
    }

    const reduced = prefersReducedMotion.current;
    const timing: KeyframeAnimationOptions = {
      duration: reduced ? REDUCED_MS : duration,
      easing: reduced ? 'ease' : MORPH_EASING,
      fill: 'forwards',
    };

    animations = [
      dialog.animate(keyframes(from, to), timing),
      dialog.animate(
        { opacity: backdrop },
        { ...timing, pseudoElement: '::backdrop' },
      ),
    ];

    try {
      await Promise.all(animations.map((animation) => animation.finished));
      return true;
    } catch {
      return false;
    }
  }

  function followSlot(from: FrameStyle, box: DOMRect): () => void {
    let frame = requestAnimationFrame(function follow(): void {
      const effect = animations[0]?.effect;

      if (slot && effect instanceof KeyframeEffect) {
        effect.setKeyframes(
          keyframes(
            from,
            frameAt(slot.getBoundingClientRect(), FRAME_RADIUS_PX, '1', box),
          ),
        );
      }

      frame = requestAnimationFrame(follow);
    });

    return () => cancelAnimationFrame(frame);
  }

  function keyframes(from: FrameStyle, to: FrameStyle): Keyframe[] {
    const fade: Keyframe =
      to.opacity === '0'
        ? { opacity: from.opacity, offset: 1 - FADE_SPAN }
        : { opacity: to.opacity, offset: FADE_SPAN };

    return [from, fade, to];
  }

  function stop(): void {
    for (const animation of animations) {
      animation.cancel();
    }

    animations = [];
  }

  function restingFrame(inline: DOMRect, box: DOMRect): FrameStyle {
    const origin = heroTakeover.origin;

    if (prefersReducedMotion.current) {
      return { ...FULL_FRAME, opacity: '0' };
    }

    if (inView(inline)) {
      return frameAt(inline, FRAME_RADIUS_PX, '1', box);
    }

    if (origin) {
      return frameAt(origin, origin.height / 2, '0', box);
    }

    return { ...FULL_FRAME, opacity: '0', scale: String(HIDDEN_SCALE) };
  }

  function inView(rect: DOMRect): boolean {
    return rect.bottom > 0 && rect.top < window.innerHeight;
  }

  function frameAt(
    rect: DOMRect,
    radius: number,
    opacity: string,
    box: DOMRect,
  ): FrameStyle {
    return {
      inset: `${rect.top - box.top}px ${box.right - rect.right}px ${box.bottom - rect.bottom}px ${rect.left - box.left}px`,
      borderRadius: `${radius}px`,
      opacity,
      scale: '1',
    };
  }

  function currentFrame(node: HTMLDialogElement): FrameStyle {
    const style = getComputedStyle(node);

    return {
      inset: `${style.top} ${style.right} ${style.bottom} ${style.left}`,
      borderRadius: style.borderTopLeftRadius,
      opacity: style.opacity,
      scale: style.scale,
    };
  }

  function backdropOpacity(node: HTMLDialogElement): string {
    return getComputedStyle(node, '::backdrop').opacity;
  }

  function onCancel(event: Event): void {
    event.preventDefault();

    if (claimShown) {
      heroClaim.hide();
      return;
    }

    heroTakeover.minimize();
    keepToggleFocus();
  }

  function onClose(): void {
    if (!dialog || !slot || dialog.open || !full) {
      return;
    }

    stop();
    target = 'inline';
    full = false;
    settled = false;
    slot.style.height = '';
    heroTakeover.minimize();
  }

  function onMinimize(): void {
    heroTakeover.minimize();
    keepToggleFocus();
  }

  function onExpand(): void {
    heroTakeover.expand(null);
    keepToggleFocus();
  }

  function keepToggleFocus(): void {
    flushSync();
    toggleButton?.focus({ preventScroll: true });
  }
</script>

<!--
  Frame column = the nav column. From lg the frame bleeds 16px past it on both
  sides (lg:-mx-4) and every inner edge is padded 16px, so what is inside the
  frame sits on the nav's x, not the frame's ring. Simon: "left aligned content
  should be matching topbar's content width, always".

  From lg the frame keeps a 16:9 ratio and mirrors the app's monitor page:
  sidebar, then the monitor, its uptime history and its settings.

  The frame is a mock of the app, so snippets and markdown twins skip it.
-->
<div
  data-nosnippet
  class="relative mx-auto w-full max-w-landing px-4 pt-8 pb-8 sm:px-6 lg:px-10 lg:pt-12 lg:pb-14"
>
  <div bind:this={slot} class="lg:-mx-4">
    <dialog
      bind:this={dialog}
      id={HERO_SHOWCASE_ID}
      data-app-frame
      aria-label="Your dashboard"
      tabindex="-1"
      class={[
        'ring-surface-100-border bg-surface-root-bg text-fg-default flex tracking-normal h-auto max-h-none max-w-none shadow-[0_32px_64px_-24px_rgba(0,0,0,0.7)] ring-1 outline-none backdrop:right-auto backdrop:w-screen backdrop:bg-surface-root-bg',
        full
          ? 'fixed inset-0 mr-[calc(100%-100vw)] w-auto rounded-none overscroll-contain'
          : 'relative w-full rounded-xl lg:aspect-video',
        settled ? 'overflow-y-auto' : 'overflow-hidden',
      ]}
      oncancel={onCancel}
      onclose={onClose}
    >
      <HeroDashboard covered={claimShown}>
        {#snippet toggle()}
          {#if expanded}
            <Tooltip content={backHint} placement="bottom" align="right">
              <button
                bind:this={toggleButton}
                type="button"
                class={WINDOW_BUTTON_CLASS}
                aria-label="Back to site"
                onclick={onMinimize}
              >
                <Minimize2Icon class="size-4" />
              </button>
            </Tooltip>
          {:else if heroTakeover.available}
            <Tooltip
              content="Open full screen"
              placement="bottom"
              align="right"
            >
              <button
                bind:this={toggleButton}
                type="button"
                class={WINDOW_BUTTON_CLASS}
                aria-label="Open full screen"
                onclick={onExpand}
              >
                <Maximize2Icon class="size-4" />
              </button>
            </Tooltip>
          {/if}
        {/snippet}
      </HeroDashboard>

      {#if full && expanded && settled}
        <HeroClaimCard />
      {/if}
    </dialog>
  </div>
</div>

{#snippet backHint()}
  <span
    class="bg-surface-elevated-bg edge flex items-center gap-2 rounded-lg py-1 pr-1.5 pl-3 text-sm whitespace-nowrap text-fg-default shadow"
  >
    Back to site
    <kbd
      class="border-surface-elevated-border text-fg-tertiary rounded border px-1.5 font-sans text-[11px] leading-4"
    >
      Esc
    </kbd>
  </span>
{/snippet}

<style>
  :global(html:has(#hero-showcase:modal)) {
    overflow: hidden;
  }
</style>
