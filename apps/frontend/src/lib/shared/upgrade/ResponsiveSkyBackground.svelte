<script lang="ts">
  import SkyBackground from '$lib/shared/upgrade/SkyBackground.svelte';
  import { onMount } from 'svelte';
  import { cubicInOut } from 'svelte/easing';
  import { scale } from 'svelte/transition';
  import { upgradeState } from './upgrade.state.svelte.js';

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

{#if upgradeState.backgroundVisible || upgradeState.modalOpen}
  <div
    in:scale={{ duration: 100, easing: cubicInOut, start: 0.9 }}
    out:scale={{ duration: 100, easing: cubicInOut, start: 0.9 }}
    class="fixed left-0 top-0 h-full w-full overflow-hidden"
  >
    <SkyBackground {density} />
  </div>
{/if}
