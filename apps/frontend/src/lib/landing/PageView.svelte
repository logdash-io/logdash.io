<script lang="ts">
  import { page } from '$app/state';
  import { getContext, onMount, setContext, type Snippet } from 'svelte';
  import type { ClassValue } from 'svelte/elements';
  import type { TransitionConfig } from 'svelte/transition';
  import {
    BLUR_PX,
    pageTransition,
    type PageViewHandle,
  } from './page-transition.svelte';

  type Props = {
    /**
     * Derives this view's key from a URL. The block remounts, and transitions,
     * whenever the key changes; navigations that keep it stable leave the
     * view untouched.
     */
    keyOf: (url: URL) => string;
    class?: ClassValue;
    children: Snippet;
  };
  const { keyOf, class: className = '', children }: Props = $props();

  const DEPTH_CONTEXT = 'page-view-depth';
  const depth: number = getContext(DEPTH_CONTEXT) ?? 0;
  setContext(DEPTH_CONTEXT, depth + 1);

  let view: HTMLDivElement | undefined = $state();
  const handle: PageViewHandle = {
    depth,
    keyOf: (url) => keyOf(url),
    element: () => view,
  };
  const key = $derived(keyOf(page.url));
  const arc = $derived(pageTransition.isArcView(handle));

  onMount(() => pageTransition.register(handle));

  const pageIn: (node: Element) => TransitionConfig = () =>
    pageTransition.pageIn(handle);
</script>

<div class={['page', className, { arc }]} style="--arc-blur: {BLUR_PX}px">
  {#key key}
    <div class="page-view flex w-full flex-col" bind:this={view} in:pageIn>
      {@render children()}
    </div>
  {/key}
</div>

<style>
  .page.arc > .page-view {
    filter: blur(var(--arc-blur));
    opacity: 0.3;
  }
</style>
