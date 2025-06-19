<script lang="ts">
  import SkyBackground from '$lib/shared/ui/components/SkyBackground.svelte';
  import { onMount, type Snippet } from 'svelte';
  import { cubicInOut } from 'svelte/easing';
  import { scale } from 'svelte/transition';
  import { backgroundState } from '../../application/background.state.svelte.js';
  import ClusterNav from './ClusterNav.svelte';

  type Props = {
    children: Snippet;
  };
  const { children }: Props = $props();

  let width = $state(typeof window !== 'undefined' ? window.innerWidth : 1200);

  onMount(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => {
      width = window.innerWidth;
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  });

  const density = $derived(
    width < 640
      ? 1
      : width < 768
        ? 2
        : width < 1024
          ? 3
          : width < 1280
            ? 4
            : width < 1920
              ? 5
              : width < 2560
                ? 7
                : 9,
  );
</script>

<div class="relative mx-auto flex h-full w-full flex-col gap-4 p-4 pt-0 lg:p-0">
  {#if backgroundState.isVisible}
    <div
      in:scale={{ duration: 100, easing: cubicInOut, start: 0.9 }}
      out:scale={{ duration: 100, easing: cubicInOut, start: 0.9 }}
      class="fixed left-0 top-0 h-full w-full overflow-hidden"
    >
      <SkyBackground {density} />
    </div>
  {/if}
  <ClusterNav />
  <div class="xl:w-7xl mx-auto flex h-full max-h-full w-full">
    <div class="relative flex h-full w-full flex-col items-center">
      {@render children()}
    </div>
  </div>
</div>
