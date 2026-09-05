<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { tick } from 'svelte';
  import { cubicOut, quintOut } from 'svelte/easing';
  import { prefersReducedMotion } from 'svelte/motion';
  import type { TransitionConfig } from 'svelte/transition';
  import { ArrowRightIcon } from 'lucide-svelte';
  import ChevronDownIcon from '$lib/domains/shared/icons/ChevronDownIcon.svelte';
  import {
    NAV_ITEMS,
    NAV_PANELS,
    isCurrentTarget,
    isMenuActive,
    menuPosition,
    type NavMenuKey,
    type NavTarget,
  } from './nav.data';

  /** Hover intent: sweeping the pointer across the nav opens nothing. */
  const OPEN_DELAY_MS = 60;
  /** Grace for crossing the gap between a trigger and the panel. */
  const CLOSE_DELAY_MS = 150;
  /** Resting on a plain link closes the panel; passing over one does not. */
  const LINK_CLOSE_DELAY_MS = 260;
  const OPEN_MS = 220;
  const CLOSE_MS = 160;
  const SLIDE_MS = 200;
  const SLIDE_PX = 20;

  let active = $state<NavMenuKey | null>(null);
  /** +1 when the pointer moved to a menu further right, -1 further left. */
  let direction = $state(1);
  let size = $state<{ width: number; height: number } | null>(null);
  /**
   * Size only animates while switching menus. On the first open it is set
   * before paint, so nothing should ease in from zero.
   */
  let moving = $state(false);

  let list = $state<HTMLUListElement | null>(null);
  let positioner = $state<HTMLDivElement | null>(null);
  let content = $state<HTMLDivElement | null>(null);

  let openTimer: ReturnType<typeof setTimeout> | null = null;
  let closeTimer: ReturnType<typeof setTimeout> | null = null;

  function clearTimers(): void {
    if (openTimer) clearTimeout(openTimer);
    if (closeTimer) clearTimeout(closeTimer);
    openTimer = null;
    closeTimer = null;
  }

  async function open(key: NavMenuKey): Promise<void> {
    clearTimers();
    if (active === key) return;
    if (active) {
      direction = menuPosition(key) > menuPosition(active) ? 1 : -1;
      moving = true;
    }
    active = key;
    await tick();
    measure();
  }

  function close(): void {
    clearTimers();
    active = null;
    size = null;
    moving = false;
  }

  function scheduleOpen(key: NavMenuKey): void {
    clearTimers();
    if (active) {
      void open(key);
      return;
    }
    openTimer = setTimeout(() => void open(key), OPEN_DELAY_MS);
  }

  function scheduleClose(delay = CLOSE_DELAY_MS): void {
    clearTimers();
    closeTimer = setTimeout(close, delay);
  }

  /** The panel takes the size of whichever content is active. */
  function measure(): void {
    if (!active || !content) return;
    size = { width: content.offsetWidth, height: content.offsetHeight };
  }

  function inRegion(node: EventTarget | null): boolean {
    return (
      node instanceof Node &&
      ((list?.contains(node) ?? false) || (positioner?.contains(node) ?? false))
    );
  }

  function onRegionFocusOut(event: FocusEvent): void {
    if (active && !inRegion(event.relatedTarget)) close();
  }

  async function onTriggerKeydown(
    event: KeyboardEvent,
    key: NavMenuKey,
  ): Promise<void> {
    if (event.key !== 'ArrowDown') return;
    event.preventDefault();
    await open(key);
    content?.querySelector<HTMLElement>('a')?.focus();
  }

  function onWindowKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || !active) return;
    const trigger = list?.querySelector<HTMLElement>(`[data-menu="${active}"]`);
    close();
    trigger?.focus();
  }

  function onWindowPointerDown(event: PointerEvent): void {
    if (active && !inRegion(event.target)) close();
  }

  function anchorAttrs(target: NavTarget): Record<string, string> {
    return target.kind === 'internal'
      ? { href: resolve(target.path) }
      : { href: target.href, target: '_blank', rel: 'noopener noreferrer' };
  }

  /**
   * The panel hinges on its top edge: it starts lying back into the page at
   * 90% and swings down to face the reader. Closing is the same move, shorter.
   */
  function unfold(
    _node: Element,
    _params: undefined,
    options: { direction: 'in' | 'out' | 'both' },
  ): TransitionConfig {
    const opening = options.direction !== 'out';
    if (prefersReducedMotion.current) {
      return { duration: 120, css: (t) => `opacity: ${t}` };
    }
    return {
      duration: opening ? OPEN_MS : CLOSE_MS,
      easing: opening ? quintOut : cubicOut,
      css: (t, u) =>
        `opacity: ${t}; transform: rotateX(${(-24 * u).toFixed(2)}deg) scale(${(0.9 + 0.1 * t).toFixed(3)})`,
    };
  }

  function slideIn(_node: Element, dir: number): TransitionConfig {
    const distance = prefersReducedMotion.current ? 0 : SLIDE_PX;
    return {
      duration: SLIDE_MS,
      easing: quintOut,
      css: (t, u) =>
        `opacity: ${t}; transform: translateX(${(dir * u * distance).toFixed(2)}px)`,
    };
  }

  function slideOut(_node: Element, dir: number): TransitionConfig {
    const distance = prefersReducedMotion.current ? 0 : SLIDE_PX;
    return {
      duration: SLIDE_MS * 0.7,
      easing: cubicOut,
      css: (t, u) =>
        `opacity: ${t}; transform: translateX(${(-dir * u * distance).toFixed(2)}px)`,
    };
  }

  const ITEM_CLASS =
    'flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-ink duration-150';

  function itemClass(current: boolean, open = false): string[] {
    return [
      ITEM_CLASS,
      current || open
        ? 'text-base-content'
        : 'text-neutral-400 hover:text-base-content',
      { 'bg-neutral-900': open },
    ] as string[];
  }
</script>

<svelte:window
  onkeydown={onWindowKeydown}
  onpointerdown={onWindowPointerDown}
  onresize={measure}
/>

<!--
  One floating panel serves every menu. Hovering another trigger swaps the
  content in place and resizes the panel, so the menu never blinks shut
  between items. The panel is wide and right-aligned with the bar's content
  rather than centred under its trigger. The list is stretched
  to the bar's full height and the positioner pads the gap above the panel, so
  the pointer never crosses dead space on its way down.
-->
<ul
  bind:this={list}
  class="ml-auto hidden h-full items-center gap-1 lg:flex"
  onpointerenter={clearTimers}
  onpointerleave={() => scheduleClose()}
  onfocusout={onRegionFocusOut}
>
  {#each NAV_ITEMS as item (item.name)}
    <li class="flex">
      {#if item.kind === 'menu'}
        <button
          type="button"
          data-menu={item.key}
          aria-haspopup="true"
          aria-expanded={active === item.key}
          class={itemClass(
            isMenuActive(item, page.url.pathname),
            active === item.key,
          )}
          onpointerenter={(event) => {
            if (event.pointerType === 'mouse') scheduleOpen(item.key);
          }}
          onclick={() => (active === item.key ? close() : void open(item.key))}
          onkeydown={(event) => onTriggerKeydown(event, item.key)}
        >
          {item.name}
          <ChevronDownIcon
            class={[
              '-mr-1 size-3.5 transition-transform duration-200 ease-out',
              active === item.key
                ? 'rotate-180 text-base-content'
                : 'text-neutral-600',
            ]}
          />
        </button>
      {:else if item.kind === 'link'}
        <a
          href={resolve(item.path)}
          draggable="false"
          class={itemClass(page.url.pathname === item.path)}
          onpointerenter={() => {
            if (active) scheduleClose(LINK_CLOSE_DELAY_MS);
          }}
        >
          {item.name}
        </a>
      {:else}
        <!-- eslint-disable svelte/no-navigation-without-resolve -- mailto -->
        <a
          href={item.href}
          draggable="false"
          class={itemClass(false)}
          onpointerenter={() => {
            if (active) scheduleClose(LINK_CLOSE_DELAY_MS);
          }}
        >
          <!-- eslint-enable svelte/no-navigation-without-resolve -->
          {item.name}
        </a>
      {/if}
    </li>
  {/each}
</ul>

{#if active}
  <div
    bind:this={positioner}
    role="presentation"
    class="nav-panel-positioner"
    onpointerenter={clearTimers}
    onpointerleave={() => scheduleClose()}
    onfocusout={onRegionFocusOut}
  >
    <div
      class={[
        'nav-panel border-hairline bg-base-300 rounded-[14px] border',
        { moving },
      ]}
      style:width={size ? `${size.width}px` : undefined}
      style:height={size ? `${size.height}px` : undefined}
      transition:unfold
    >
      {#key active}
        <div
          bind:this={content}
          class="absolute top-0 left-0 w-max"
          in:slideIn={direction}
          out:slideOut={direction}
        >
          {@render panel(active)}
        </div>
      {/key}
    </div>
  </div>
{/if}

<!-- Internal hrefs go through resolve() in anchorAttrs(); external ones open in a new tab. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
{#snippet panel(key: NavMenuKey)}
  {@const menu = NAV_PANELS[key]}
  <div class="p-2">
    <div
      class="divide-hairline bg-neutral-900 ring-hairline grid grid-cols-[280px_280px_280px] divide-x rounded-lg ring-1 ring-inset"
    >
      {#each menu.columns as column, columnIndex (columnIndex)}
        <div class="flex flex-col p-2">
          {#each column.items as item (item.title)}
            <a
              {...anchorAttrs(item)}
              draggable="false"
              class={[
                'hover:bg-neutral-800 group flex flex-col gap-1.5 rounded-md px-3.5 py-3',
                {
                  'bg-neutral-800': isCurrentTarget(item, page.url.pathname),
                },
              ]}
              onclick={close}
            >
              <span class="text-[15px] leading-5 font-medium">
                {item.title}
              </span>
              <span
                class="text-neutral-500 group-hover:text-neutral-400 text-[15px] leading-5"
              >
                {item.description}
              </span>
            </a>
          {/each}
        </div>
      {/each}
      <div class="flex flex-col p-2 pt-2.5">
        {#each menu.links as link (link.title)}
          <a
            {...anchorAttrs(link)}
            draggable="false"
            class={[
              'hover:bg-neutral-800 hover:text-base-content rounded-md px-3.5 py-2.5 text-[15px] leading-5',
              isCurrentTarget(link, page.url.pathname)
                ? 'text-base-content'
                : 'text-neutral-300',
            ]}
            onclick={close}
          >
            {link.title}
          </a>
        {/each}
      </div>
    </div>
    {#if menu.footer}
      <div
        class="flex items-center justify-between px-5.5 pt-4 pb-3 text-[15px]"
      >
        <span class="flex items-center gap-2">
          <span class="font-medium">{menu.footer.badge}</span>
          <span class="text-neutral-500">{menu.footer.text}</span>
        </span>
        <a
          {...anchorAttrs(menu.footer.cta)}
          draggable="false"
          class="text-neutral-500 hover:text-base-content group flex items-center gap-1.5 transition-ink duration-150"
          onclick={close}
        >
          {menu.footer.cta.label}
          <ArrowRightIcon
            class="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5"
          />
        </a>
      </div>
    {/if}
  </div>
{/snippet}

<!-- eslint-enable svelte/no-navigation-without-resolve -->

<style>
  .nav-panel-positioner {
    position: absolute;
    top: 100%;
    /* Flush with the bar's content edge: the container pads lg:px-10. */
    right: 2.5rem;
    width: max-content;
    padding-top: 4px;
    perspective: 1600px;
    perspective-origin: 50% 0;
  }

  .nav-panel {
    position: relative;
    /* width/height come from the measured content; the border sits outside. */
    box-sizing: content-box;
    overflow: hidden;
    transform-origin: 50% 0;
    box-shadow:
      0 1px 1px rgb(0 0 0 / 0.12),
      0 8px 24px rgb(0 0 0 / 0.18);
  }

  .nav-panel.moving {
    transition:
      width 220ms cubic-bezier(0.22, 1, 0.36, 1),
      height 220ms cubic-bezier(0.22, 1, 0.36, 1);
  }

  @media (prefers-reduced-motion: reduce) {
    .nav-panel.moving {
      transition: none;
    }
  }
</style>
