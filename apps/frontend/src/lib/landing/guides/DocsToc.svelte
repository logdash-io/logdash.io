<script lang="ts">
  import { page } from '$app/state';
  import { tick, untrack } from 'svelte';

  type Props = {
    /** The article column. Its `h2[id]` headings make up the list. */
    container: HTMLElement | undefined;
  };
  const { container }: Props = $props();

  type Entry = { id: string; text: string; element: HTMLElement };

  /**
   * A heading counts as reached once its top passes this line, measured from
   * the top of the viewport: the 64px nav plus the article's `scroll-mt-24`
   * offset, so a heading jumped to via its link reads as current right away.
   */
  const REACHED_LINE_PX = 100;

  let entries: Entry[] = $state.raw([]);
  let activeId: string | null = $state(null);

  function update(): void {
    let current = entries[0]?.id ?? null;
    for (const entry of entries) {
      if (entry.element.getBoundingClientRect().top > REACHED_LINE_PX) break;
      current = entry.id;
    }
    activeId = current;
  }

  // The article remounts on every docs navigation, so the headings are read
  // again per pathname, after the new DOM has rendered.
  $effect(() => {
    void page.url.pathname;
    if (!container) return;
    let cancelled = false;
    tick().then(() => {
      if (cancelled) return;
      entries = [...container.querySelectorAll<HTMLElement>('h2[id]')].map(
        (element) => ({
          id: element.id,
          text: element.textContent?.trim() ?? '',
          element,
        }),
      );
      untrack(update);
    });
    return () => {
      cancelled = true;
    };
  });

  $effect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  });
</script>

{#if entries.length > 0}
  <nav
    aria-label="On this page"
    class="sticky top-16 max-h-[calc(100dvh-4rem)] overflow-y-auto px-4 py-8 lg:px-6 lg:py-10"
  >
    <h3 class="mb-1 px-2.5 text-sm font-medium">On this page</h3>
    <ul class="flex flex-col gap-px">
      {#each entries as entry (entry.id)}
        <li>
          <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- same-page anchor -->
          <a
            href="#{entry.id}"
            class={[
              'flex min-h-8 items-center rounded-lg px-2.5 text-sm leading-5 transition-ink duration-150',
              activeId === entry.id
                ? 'text-base-content'
                : 'text-neutral-400 hover:text-base-content',
            ]}
            aria-current={activeId === entry.id ? 'location' : undefined}
          >
            {entry.text}
          </a>
        </li>
      {/each}
    </ul>
  </nav>
{/if}
