<script lang="ts">
  import { onMount } from 'svelte';
  import { backgroundState } from '$lib/shared/upgrade/background.state.svelte.js';
  import { scale } from 'svelte/transition';
  import { cubicInOut } from 'svelte/easing';
  import SkyBackground from '$lib/shared/upgrade/SkyBackground.svelte';

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
                : 11,
  );
</script>

{#if backgroundState.isVisible}
  <div
    in:scale={{ duration: 100, easing: cubicInOut, start: 0.9 }}
    out:scale={{ duration: 100, easing: cubicInOut, start: 0.9 }}
    class="fixed left-0 top-0 h-full w-full overflow-hidden"
  >
    <SkyBackground {density} />
  </div>
{/if}
