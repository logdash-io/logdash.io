<script lang="ts">
  import {
    faviconUrl,
    isDarkGlyph,
  } from '$lib/domains/shared/utils/favicon.js';
  import type { ClassValue } from 'svelte/elements';

  type Props = {
    name: string;
    color?: string;
    class?: ClassValue;
  };

  const {
    name,
    color,
    class: className = 'size-4 rounded-[5px] text-[10px]',
  }: Props = $props();

  const tint = $derived(
    color && /^#[0-9a-f]{6}$/i.test(color) ? color : undefined,
  );
  const favicon = $derived(faviconUrl(name));

  let loaded = $state<{ src: string; dark: boolean } | null>(null);

  const showFavicon = $derived(!!favicon && loaded?.src === favicon);
</script>

<span
  class={[
    'relative flex shrink-0 items-center justify-center overflow-hidden font-semibold uppercase',
    { 'bg-surface-200-bg text-fg-secondary': !tint && !showFavicon },
    { 'bg-surface-inverse-bg': showFavicon && loaded?.dark },
    className,
  ]}
  style={tint && !showFavicon
    ? `background-color: color-mix(in oklab, ${tint} 26%, transparent); color: color-mix(in oklab, ${tint} 60%, white)`
    : undefined}
  aria-hidden="true"
>
  {#if !showFavicon}
    {name.trim().charAt(0) || '?'}
  {/if}
  {#if favicon}
    <img
      src={favicon}
      alt=""
      crossorigin="anonymous"
      class={[
        'absolute inset-0 size-full object-contain',
        { invisible: !showFavicon, 'p-px': loaded?.dark },
      ]}
      onload={(event) =>
        (loaded = { src: favicon, dark: isDarkGlyph(event.currentTarget) })}
    />
  {/if}
</span>
