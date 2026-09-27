<script lang="ts" generics="T extends { key: number }">
  import type { Snippet } from 'svelte';
  import { flip } from 'svelte/animate';
  import { quintOut } from 'svelte/easing';
  import { prefersReducedMotion } from 'svelte/motion';
  import type { TransitionConfig } from 'svelte/transition';

  type Props = {
    items: T[];
    visible: number;
    gap?: number;
    row: Snippet<[T]>;
  };

  const { items, visible, gap = 8, row }: Props = $props();

  /**
   * Quick start, long settle. The stack moves the moment a row lands instead
   * of easing into motion, which is what made a longer in-out feel sluggish.
   */
  const ROLL_MS = 500;
  const ROLL_EASING_CSS = 'cubic-bezier(0.22, 1, 0.36, 1)';

  const rendered = $derived(items.slice(0, visible + 1));
  const duration = $derived(prefersReducedMotion.current ? 0 : ROLL_MS);

  /**
   * Only a row landing at the top is an arrival. Rows that show up further
   * down because the window grew just appear in place.
   */
  function rollIn(node: HTMLElement, index: number): TransitionConfig {
    if (index !== 0) {
      return { duration: 0 };
    }

    const travel = node.offsetHeight + gap;

    return {
      duration,
      easing: quintOut,
      css: (t, u) =>
        `transform: translateY(${(-u * travel).toFixed(2)}px); opacity: ${t}`,
    };
  }
</script>

<!--
  Only the first `visible` rows get real tracks. The row rolling out, and the
  extra row Svelte keeps in the DOM for a moment while it measures a leaving
  item, both land in 0px implicit tracks, so the feed never changes height
  mid-roll. A height blip here moves everything below it, and Chrome's scroll
  anchoring turns that into a page jump. Spacing is a margin rather than
  row-gap for the same reason: gaps are counted per track, margins are not.
-->
<div
  class="grid grid-cols-[minmax(0,1fr)] auto-rows-[0px]"
  style:grid-template-rows="repeat({visible}, auto)"
  aria-hidden="true"
>
  {#each rendered as item, index (item.key)}
    <div
      class={[
        'min-w-0 self-start transition-opacity',
        { 'opacity-0': index === visible },
      ]}
      style:margin-top={index === 0 ? undefined : `${gap}px`}
      style:transition-duration="{duration}ms"
      style:transition-timing-function={ROLL_EASING_CSS}
      animate:flip={{ duration, easing: quintOut }}
      in:rollIn={index}
    >
      {@render row(item)}
    </div>
  {/each}
</div>
