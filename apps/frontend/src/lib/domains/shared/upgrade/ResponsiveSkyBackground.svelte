<script lang="ts">
  import SkyBackground from '$lib/domains/shared/upgrade/SkyBackground.svelte';
  import { onMount } from 'svelte';
  import { cubicInOut } from 'svelte/easing';
  import { fade, scale } from 'svelte/transition';
  import { upgradeState } from '$lib/domains/shared/upgrade/upgrade.state.svelte.js';
  import { proSkyBackgroundState } from '$lib/domains/shared/pro-features/pro-sky-background.state.svelte.js';
  import { userState } from '$lib/domains/shared/user/application/user.state.svelte.js';

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

  const shouldShowBackground = $derived(
    upgradeState.backgroundVisible ||
      upgradeState.modalOpen ||
      (userState.isPro &&
        proSkyBackgroundState.enabled &&
        proSkyBackgroundState.initialized),
  );
</script>

{#if shouldShowBackground}
  <div
    in:fade={{ duration: 300, easing: cubicInOut }}
    out:scale={{ duration: 100, easing: cubicInOut, start: 0.9 }}
    class="pointer-events-none fixed left-0 top-0 h-full w-full overflow-hidden"
  >
    <SkyBackground {density} />
  </div>
{/if}
