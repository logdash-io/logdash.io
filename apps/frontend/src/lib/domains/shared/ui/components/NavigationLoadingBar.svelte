<script lang="ts">
  import { afterNavigate, beforeNavigate } from '$app/navigation';
  import { circOut } from 'svelte/easing';
  import { Tween } from 'svelte/motion';
  import { fade } from 'svelte/transition';

  let isNavigating = $state(false);
  const progress = new Tween(0, { duration: 400, easing: circOut });

  async function startProgress() {
    progress.set(0, { duration: 0 });
    isNavigating = true;
    await progress.set(95, {
      duration: 2050,
    });
  }

  async function completeProgress() {
    const duration = 250;
    setTimeout(() => {
      isNavigating = false;
    }, duration - 50);

    await progress.set(100, { duration });
    progress.set(0, { duration: 0 });
  }

  beforeNavigate(({ from, to }) => {
    if (from?.url.pathname === to?.url.pathname) {
      return;
    }
    startProgress();
  });

  afterNavigate(() => {
    completeProgress();
  });
</script>

{#if isNavigating}
  <div
    transition:fade={{ duration: 150 }}
    class="fixed top-0 left-0 z-50 h-0.5 w-full"
  >
    <div class="bg-primary h-full" style="width: {progress.current}%"></div>
  </div>
{/if}
