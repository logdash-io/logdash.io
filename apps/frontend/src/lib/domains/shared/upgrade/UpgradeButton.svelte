<script lang="ts">
  import SkyBackground from '$lib/domains/shared/upgrade/SkyBackground.svelte';
  import { type UpgradeSource } from '$lib/domains/shared/upgrade/start-tier-upgrade.util.js';
  import { upgradeState } from '$lib/domains/shared/upgrade/upgrade.state.svelte.js';
  import { RocketIcon } from 'lucide-svelte';
  import type { PostHog } from 'posthog-js';
  import { getContext, onDestroy, type Snippet } from 'svelte';
  import type { ClassValue } from 'svelte/elements';
  import { fade } from 'svelte/transition';
  import { userState } from '../user/application/user.state.svelte.js';
  import type { UserTier } from '../types.js';

  type Props = {
    class?: ClassValue;
    children?: Snippet;
    source?: UpgradeSource;
    to?: UserTier;
  };
  const {
    class: className = '',
    children,
    source = 'unknown',
    to,
  }: Props = $props();
  const posthog = getContext<PostHog>('posthog');
  let upgrading = $state(false);

  const onMouseEnter = () => {
    upgradeState.showBackground();
  };

  const onMouseLeave = () => {
    upgradeState.hideBackground();
  };

  onDestroy(() => {
    upgradeState.hideBackground();
  });
</script>

<div class={['btn-wrapper z-10 w-full rounded-[13px] p-[1px]', className]}>
  <button
    class="btn btn-neutral relative w-full overflow-hidden"
    onclick={() => {
      upgrading = true;
      const nextTier = userState.upgrade(source, to);
      if (nextTier) {
        posthog.capture('upgrade_initiated', {
          source,
          timestamp: new Date().toISOString(),
          tier: nextTier,
        });
      }
    }}
    onmouseenter={onMouseEnter}
    onmouseleave={onMouseLeave}
  >
    <div class="absolute h-full w-full overflow-hidden">
      <SkyBackground comets={false} density={0.1} speed={10} />
    </div>

    <div class="relative z-10 flex w-full items-center justify-between gap-2">
      {#if children}
        {@render children?.()}
      {:else}
        Upgrade your plan
      {/if}

      {#if upgrading}
        <div
          in:fade={{ duration: 150 }}
          class="flex h-4 w-4 items-center justify-center"
        >
          <span class="loading loading-xs loading-spinner"></span>
        </div>
      {:else}
        <RocketIcon class="inline h-4 w-4" />
      {/if}
    </div>
  </button>
</div>

<style>
  @property --gradient-angle {
    syntax: '<angle>';
    initial-value: 90deg;
    inherits: false;
  }

  .btn-wrapper {
    --bg-background: #bada55;
    --clr-card: rgba(255, 255, 255, 0.1);
    --clr-1: transparent;
    --clr-2: transparent;
    --clr-3: rgba(255, 255, 255, 0.4);

    position: relative;
    background-color: var(--clr-card);

    &:hover {
      --clr-3: var(--color-primary);
    }
  }

  .btn-wrapper::after,
  .btn-wrapper::before {
    content: ' ';
    position: absolute;
    z-index: -1;
    inset: -0.02rem;
    background: conic-gradient(
      from var(--gradient-angle),
      var(--clr-card),
      var(--clr-1),
      var(--clr-2),
      var(--clr-3),
      /* var(--clr-2), */ /* var(--clr-1), */ var(--clr-card)
    );
    border-radius: inherit;
    animation: rotate 4.5s linear infinite;
  }

  .btn-wrapper::after {
    filter: blur(3rem);
  }

  @keyframes rotate {
    0% {
      --gradient-angle: 0deg;
    }
    100% {
      --gradient-angle: 360deg;
    }
  }
</style>
