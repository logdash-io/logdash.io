<script lang="ts">
  import { Tooltip } from '@logdash/hyper-ui/presentational';
  import { untrack } from 'svelte';

  type Item = {
    id: string;
    text: string;
    icon: string;
    el: HTMLElement;
  };

  const GROW_PEAK = 16;
  const GROW_DECAY = 0.4;
  const CURRENT_OFFSET = 120;
  const NAMES_SPACE = 248;
  const TICKS_SPACE = 88;
  const TICKS_INSET = 24;

  let items = $state.raw<Item[]>([]);
  let currentId = $state<string | null>(null);
  let inviewIds = $state.raw<string[]>([]);
  let hoveredIndex = $state<number | null>(null);
  let mode = $state<'names' | 'ticks' | null>(null);
  let namesTop = $state(0);
  let gutter = $state(0);
  let scroller: HTMLElement | null = null;
  let suppressUntil = 0;
  let scrollFrame = 0;

  function track(anchor: HTMLElement): () => void {
    return untrack(() => observe(anchor));
  }

  function observe(anchor: HTMLElement): () => void {
    const root = anchor.parentElement;
    if (!root) {
      return () => {};
    }
    scroller = scrollParent(root);
    const collect = (): void => {
      items = [
        ...root.querySelectorAll<HTMLElement>('h2[id]:not(dialog h2)'),
      ].map((el) => ({
        id: el.id,
        text: el.textContent?.trim() ?? '',
        icon: el.querySelector('[data-toc-icon]')?.innerHTML ?? '',
        el,
      }));
      measure();
    };
    const measure = (): void => {
      gutter =
        anchor.getBoundingClientRect().left -
        (scroller?.getBoundingClientRect().left ?? 0);
      mode =
        gutter >= NAMES_SPACE
          ? 'names'
          : gutter >= TICKS_SPACE
            ? 'ticks'
            : null;
      const firstCard = root.querySelector('h2[id]')?.closest('section');
      namesTop = firstCard
        ? firstCard.getBoundingClientRect().top -
          root.getBoundingClientRect().top
        : 0;
      onScroll();
    };
    collect();
    const mutations = new MutationObserver(collect);
    mutations.observe(root, { childList: true });
    const resizes = new ResizeObserver(measure);
    resizes.observe(scroller ?? document.documentElement);
    scroller?.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      mutations.disconnect();
      resizes.disconnect();
      scroller?.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(scrollFrame);
    };
  }

  function scrollParent(el: HTMLElement): HTMLElement | null {
    for (let node = el.parentElement; node; node = node.parentElement) {
      if (/auto|scroll/.test(getComputedStyle(node).overflowY)) {
        return node;
      }
    }
    return null;
  }

  function onScroll(): void {
    if (scrollFrame) {
      return;
    }
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0;
      const bounds = viewBounds();
      const next = computeInview(bounds);
      if (next.join('\n') !== inviewIds.join('\n')) {
        inviewIds = next;
      }
      if (performance.now() >= suppressUntil) {
        currentId = computeCurrent(bounds);
      }
    });
  }

  function viewBounds(): { top: number; bottom: number } {
    const rect = scroller?.getBoundingClientRect();
    return { top: rect?.top ?? 0, bottom: rect?.bottom ?? window.innerHeight };
  }

  function computeInview(bounds: { top: number; bottom: number }): string[] {
    return items
      .filter((item, i) => {
        const top = item.el.getBoundingClientRect().top;
        const next = items[i + 1]?.el.getBoundingClientRect().top;
        const bottom =
          next ?? item.el.closest('section')?.getBoundingClientRect().bottom;
        return (bottom ?? top) > bounds.top && top < bounds.bottom;
      })
      .map((item) => item.id);
  }

  function computeCurrent(bounds: {
    top: number;
    bottom: number;
  }): string | null {
    const line =
      bounds.top +
      CURRENT_OFFSET +
      (bounds.bottom - bounds.top - CURRENT_OFFSET) * scrollProgress() ** 2;
    return (
      items.findLast((item) => item.el.getBoundingClientRect().top <= line)
        ?.id ??
      items[0]?.id ??
      null
    );
  }

  function scrollProgress(): number {
    if (!scroller) {
      return 0;
    }
    const range = scroller.scrollHeight - scroller.clientHeight;
    return range > 0 ? Math.min(1, scroller.scrollTop / range) : 0;
  }

  function growFor(index: number): string {
    if (hoveredIndex === null) {
      return '0px';
    }
    const grow =
      GROW_PEAK * Math.pow(GROW_DECAY, Math.abs(index - hoveredIndex));
    return grow < 0.5 ? '0px' : `${grow}px`;
  }

  function onItemClick(event: MouseEvent, item: Item): void {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    currentId = item.id;
    suppressUntil = performance.now() + (reduced ? 100 : 1000);
    item.el.scrollIntoView({
      behavior: reduced ? 'auto' : 'smooth',
      block: 'start',
    });
  }
</script>

<div
  class={['sticky -mb-2 h-0', { 'top-1/2': mode !== 'names' }]}
  style:top={mode === 'names' ? `${namesTop}px` : undefined}
  {@attach track}
>
  {#if mode && items.length > 1}
    <nav
      class={['toc', { ticks: mode === 'ticks' }]}
      style:left={mode === 'ticks' ? `${TICKS_INSET - gutter}px` : undefined}
      aria-label="On this page"
    >
      {#if mode === 'names'}
        <ul class="flex w-44 flex-col gap-px">
          {#each items as item (item.id)}
            {@const current = currentId === item.id}
            <li>
              <a
                href="#{item.id}"
                class={[
                  'focus-visible:outline-brand flex h-7.5 items-center gap-2 rounded-lg px-2 text-[13px] font-medium focus-visible:outline-2',
                  current
                    ? 'bg-surface-50-selected-bg text-fg-default'
                    : 'hover:bg-surface-50-hover-bg hover:text-fg-default text-fg-muted',
                ]}
                aria-current={current ? 'location' : undefined}
                onclick={(event) => onItemClick(event, item)}
              >
                {#if item.icon}
                  <!-- eslint-disable-next-line svelte/no-at-html-tags -- markup cloned from our own icon components -->
                  <span class="flex shrink-0">{@html item.icon}</span>
                {/if}
                <span class="truncate">{item.text}</span>
              </a>
            </li>
          {/each}
        </ul>
      {:else}
        <ul onpointerleave={() => (hoveredIndex = null)}>
          {#each items as item, i (item.id)}
            <li data-inview={inviewIds.includes(item.id) || undefined}>
              <Tooltip content={item.text} placement="right">
                <a
                  href="#{item.id}"
                  class="tick-link"
                  style:--grow={growFor(i)}
                  aria-label={item.text}
                  aria-current={currentId === item.id ? 'location' : undefined}
                  onpointerenter={() => (hoveredIndex = i)}
                  onclick={(event) => onItemClick(event, item)}
                >
                  <span class="tick"></span>
                </a>
              </Tooltip>
            </li>
          {/each}
        </ul>
      {/if}
    </nav>
  {/if}
</div>

<style>
  .toc {
    position: absolute;
    right: 100%;
    margin-right: 48px;
  }

  .toc.ticks {
    right: auto;
    margin-right: 0;
    transform: translateY(-50%);
  }

  @media (prefers-reduced-motion: no-preference) {
    .toc {
      animation: toc-in 0.2s ease both;
    }
  }

  @keyframes toc-in {
    from {
      opacity: 0;
    }
  }

  .toc.ticks ul {
    display: flex;
    flex-direction: column;
  }

  .tick-link {
    display: flex;
    align-items: center;
    width: 24px;
    padding: 5px 0;
    border-radius: 2px;
  }

  .tick {
    flex: 0 0 auto;
    height: 2px;
    width: calc(10px + var(--grow, 0px));
    border-radius: 999px;
    background-color: var(--fg-disabled);
    transition: width 0.2s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .toc li[data-inview] .tick {
    background-color: var(--fg-muted);
  }

  .tick-link:hover .tick,
  .tick-link:focus-visible .tick,
  .tick-link[aria-current] .tick {
    background-color: var(--fg-default);
  }

  .tick-link[aria-current] .tick {
    width: calc(20px + var(--grow, 0px));
  }

  .tick-link:focus-visible {
    outline: 2px solid var(--brand);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    .tick {
      transition: none;
    }
  }
</style>
