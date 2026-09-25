<script lang="ts">
  import { anonymousPreviewState } from '$lib/domains/anonymous/application/anonymous-preview.state.svelte';
  import HomeIcon from '$lib/domains/shared/icons/HomeIcon.svelte';
  import LogsIcon from '$lib/domains/shared/icons/LogsIcon.svelte';
  import MetricsIcon from '$lib/domains/shared/icons/MetricsIcon.svelte';
  import MonitoringIcon from '$lib/domains/shared/icons/MonitoringIcon.svelte';
  import SettingsIcon from '$lib/domains/shared/icons/SettingsIcon.svelte';
  import { Tooltip } from '@logdash/hyper-ui/presentational';
  import { Maximize2Icon, Minimize2Icon } from 'lucide-svelte';
  import { flushSync, type Component } from 'svelte';
  import type { ClassValue } from 'svelte/elements';
  import { prefersReducedMotion } from 'svelte/motion';
  import { MediaQuery } from 'svelte/reactivity';
  import { match } from 'ts-pattern';
  import { HERO_SHOWCASE_ID } from './hero-anchors';
  import HeroClaimNudge from './HeroClaimNudge.svelte';
  import HeroLogsPanel from './HeroLogsPanel.svelte';
  import HeroMetricsColumn from './HeroMetricsColumn.svelte';
  import HeroMonitorTile from './HeroMonitorTile.svelte';
  import HeroSidebar from './HeroSidebar.svelte';
  import { showcaseClusterName } from './hero-showcase';
  import { heroTakeover } from './hero-takeover.svelte';
  import TypewriterText from './TypewriterText.svelte';

  type WindowBarStatus = {
    label: string;
    dotClass: string;
  };

  type ServiceTab = {
    label: string;
    icon: Component<{ class?: ClassValue }>;
    active: boolean;
  };

  type FrameStyle = {
    inset: string;
    borderRadius: string;
    opacity: string;
    scale: string;
  };

  /** The tabs a service has in the app, with its overview open. */
  const SERVICE_TABS: ServiceTab[] = [
    { label: 'Overview', icon: HomeIcon, active: true },
    { label: 'Logs', icon: LogsIcon, active: false },
    { label: 'Metrics', icon: MetricsIcon, active: false },
    { label: 'Monitoring', icon: MonitoringIcon, active: false },
    { label: 'Settings', icon: SettingsIcon, active: false },
  ];

  /** Below lg the frame grows with its content and the tail shows this many rows. */
  const LOG_ROWS = 6;
  const largeFrame = new MediaQuery('(min-width: 1024px)');

  const EXPAND_MS = 550;
  const COLLAPSE_MS = 400;
  const REDUCED_MS = 150;
  const MORPH_EASING = 'cubic-bezier(0.32, 0.72, 0, 1)';
  const FRAME_RADIUS_PX = 12;
  const HIDDEN_SCALE = 0.96;
  const FADE_SPAN = 0.6;
  const WINDOW_BUTTON_CLASS =
    'text-neutral-400 hover:text-base-content hover:bg-base-100 focus-visible:outline-neutral-500 -mr-1.5 flex size-7 shrink-0 items-center justify-center rounded-md transition-ink duration-150 focus-visible:outline-2';
  const FULL_FRAME: FrameStyle = {
    inset: '0px',
    borderRadius: '0px',
    opacity: '1',
    scale: '1',
  };

  let dialog = $state<HTMLDialogElement | null>(null);
  let slot = $state<HTMLDivElement | null>(null);
  let toggle = $state<HTMLButtonElement | null>(null);
  let full = $state(false);
  let settled = $state(false);
  let target: 'inline' | 'full' = 'inline';
  let animations: Animation[] = [];

  const phase = $derived(anonymousPreviewState.phase);
  const expanded = $derived(heroTakeover.expanded);

  const host = $derived.by(() => {
    const demoHost = anonymousPreviewState.demo.monitor?.name ?? '';

    return heroTakeover.available
      ? (anonymousPreviewState.previewHost ?? demoHost)
      : demoHost;
  });

  const status = $derived<WindowBarStatus>(
    match(phase)
      .with('creating', () => ({
        label: 'Starting',
        dotClass: 'bg-warning animate-pulse',
      }))
      .with('previewing', 'idle', () => ({
        label: 'Live',
        dotClass: 'bg-success',
      }))
      .with('ended', () => ({
        label: 'Ended',
        dotClass: 'bg-neutral-600',
      }))
      .with('error', () => ({
        label: 'Stopped',
        dotClass: 'bg-error',
      }))
      .exhaustive(),
  );

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
    toggle?.focus({ preventScroll: true });
  }
</script>

<!--
  Frame column = the nav column. From lg the frame bleeds 16px past it on both
  sides (lg:-mx-4) and every inner edge is padded 16px, so what is inside the
  frame sits on the nav's x, not the frame's ring. Simon: "left aligned content
  should be matching topbar's content width, always".

  From lg the frame keeps a 16:9 ratio and its panels share the height the way
  a service page does in the app: sidebar, then the monitor over the log tail,
  with the metrics column beside them.

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
      aria-label="Your dashboard"
      tabindex="-1"
      class={[
        'ring-hairline bg-base-200 text-base-content flex h-auto max-h-none max-w-none shadow-[0_32px_64px_-24px_rgba(0,0,0,0.7)] ring-1 outline-none backdrop:right-auto backdrop:w-screen backdrop:bg-base-300',
        full
          ? 'fixed inset-0 mr-[calc(100%-100vw)] w-auto rounded-none overscroll-contain'
          : 'relative w-full rounded-xl lg:aspect-video',
        settled ? 'overflow-y-auto' : 'overflow-hidden',
      ]}
      oncancel={onCancel}
      onclose={onClose}
    >
      <HeroSidebar />

      <div class="flex min-w-0 flex-1 flex-col">
        <div
          class="border-hairline flex h-11 shrink-0 items-center gap-3 border-b px-4"
        >
          <nav class="hidden items-center gap-1 xl:flex" aria-hidden="true">
            {#each SERVICE_TABS as tab (tab.label)}
              <span
                class={[
                  'flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-sm',
                  tab.active
                    ? 'bg-base-100 text-base-content'
                    : 'text-neutral-500',
                ]}
              >
                <tab.icon class="size-3.5 shrink-0" />
                {tab.label}
              </span>
            {/each}
          </nav>

          <span class="text-neutral-500 min-w-0 truncate text-sm xl:hidden">
            <span class="hidden sm:inline">
              {showcaseClusterName(phase)}
              <span class="text-neutral-700">/</span>
            </span>
            <TypewriterText text={host} class="text-base-content font-medium" />
          </span>

          <span
            class="text-neutral-400 ml-auto flex shrink-0 items-center gap-1.5 text-xs"
          >
            <span class={['size-1.5 rounded-full', status.dotClass]}></span>
            {status.label}
          </span>

          {#if expanded}
            <Tooltip content={backHint} placement="bottom" align="right">
              <button
                bind:this={toggle}
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
                bind:this={toggle}
                type="button"
                class={WINDOW_BUTTON_CLASS}
                aria-label="Open full screen"
                onclick={onExpand}
              >
                <Maximize2Icon class="size-4" />
              </button>
            </Tooltip>
          {/if}
        </div>

        <div class="bg-hairline flex min-h-0 flex-1 gap-px">
          <div class="bg-base-200 flex min-h-0 min-w-0 flex-1 flex-col">
            <div class="border-hairline shrink-0 border-b">
              <HeroMonitorTile />
            </div>

            <HeroLogsPanel rows={LOG_ROWS} fit={full || largeFrame.current} />
          </div>

          <div class="bg-base-200 hidden w-64 shrink-0 lg:flex xl:w-72">
            <HeroMetricsColumn />
          </div>
        </div>
      </div>

      {#if full && expanded}
        <HeroClaimNudge />
      {/if}
    </dialog>
  </div>
</div>

{#snippet backHint()}
  <span
    class="bg-base-100 flex items-center gap-2 rounded-lg py-1 pr-1.5 pl-3 text-sm whitespace-nowrap text-white shadow"
  >
    Back to site
    <kbd
      class="border-hairline text-neutral-400 rounded border px-1.5 font-sans text-[11px] leading-4"
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
