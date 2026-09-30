<script lang="ts">
  import { navigating } from '$app/state';
  import { untrack } from 'svelte';
  import { circOut } from 'svelte/easing';
  import { Tween } from 'svelte/motion';
  import { fade } from 'svelte/transition';

  const SHOW_AFTER_MS = 150;

  let isNavigating = $state(false);
  let latestNavigation = 0;
  const progress = new Tween(0, { duration: 400, easing: circOut });

  $effect(() => {
    const navigation = ++latestNavigation;

    if (!navigating.complete) {
      untrack(() => {
        if (isNavigating) {
          void completeProgress(navigation);
        }
      });
      return;
    }

    if (
      navigating.willUnload ||
      navigating.from?.url.pathname === navigating.to?.url.pathname
    ) {
      return;
    }

    const timer = setTimeout(() => void startProgress(), SHOW_AFTER_MS);

    return () => clearTimeout(timer);
  });

  async function startProgress(): Promise<void> {
    if (!isNavigating || progress.target === 100) {
      void progress.set(0, { duration: 0 });
    }

    isNavigating = true;
    await progress.set(95, {
      duration: 2050,
    });
  }

  async function completeProgress(navigation: number): Promise<void> {
    const duration = 250;
    setTimeout(() => {
      if (navigation === latestNavigation) {
        isNavigating = false;
      }
    }, duration - 50);

    await progress.set(100, { duration });
  }
</script>

{#if isNavigating}
  <div
    transition:fade={{ duration: 150 }}
    class="fixed top-0 left-0 z-50 h-0.5 w-full"
  >
    <div class="bg-brand h-full" style="width: {progress.current}%"></div>
  </div>
{/if}
