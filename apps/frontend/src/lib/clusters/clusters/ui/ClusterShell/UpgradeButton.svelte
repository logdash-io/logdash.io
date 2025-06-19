<script lang="ts">
  import { goto } from '$app/navigation';
  import SkyBackground from '$lib/shared/ui/components/SkyBackground.svelte';
  import { RocketIcon } from 'lucide-svelte';
  import { fade } from 'svelte/transition';
  import { backgroundState } from '../../application/background.state.svelte.js';
  import type { ClassValue } from 'svelte/elements';

  type Props = {
    class?: ClassValue;
  };
  const { class: className = '' }: Props = $props();

  let isHovered = $state(false);
  let upgrading = $state(false);

  const handleMouseEnter = () => {
    backgroundState.show();
    isHovered = true;
  };

  const handleMouseLeave = () => {
    backgroundState.hide();
    isHovered = false;
  };
</script>

<div class={['btn-wrapper z-10 rounded-lg p-[1px]', className]}>
  <button
    class="btn btn-neutral relative w-fit overflow-hidden"
    onmouseenter={handleMouseEnter}
    onmouseleave={handleMouseLeave}
    onclick={() => {
      upgrading = true;
      // todo: should it become part of the RoutePath enum?
      goto('/app/api/user/upgrade');
    }}
  >
    <div class="absolute h-full w-full overflow-hidden">
      <SkyBackground density={20} speed={1} comets={false} />
    </div>

    <div class="relative z-10 flex w-full items-center gap-2">
      Upgrade your plan
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
    --bg-background: transparent;
    --clr-card: transparent;
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
