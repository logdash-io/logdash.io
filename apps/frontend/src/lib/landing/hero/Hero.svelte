<script lang="ts">
  import { anonymousPreviewState } from '$lib/domains/anonymous/application/anonymous-preview.state.svelte';
  import { pageTransition } from '$lib/landing/page-transition.svelte';
  import FoundersSocialProof from '$lib/landing/social-proof/FoundersSocialProof.svelte';
  import { onMount } from 'svelte';
  import HeroShowcase from './HeroShowcase.svelte';
  import HeroStage from './HeroStage.svelte';
  import { HERO_ID } from './hero-anchors';
  import HeroUrlForm from './HeroUrlForm.svelte';
  import { heroClaim } from './hero-claim.svelte';

  // `/` is prerendered, so the `?tier` query is only readable once mounted
  let mounted = $state(false);
  const trialName = $derived(mounted ? heroClaim.trialName : undefined);

  onMount(() => {
    mounted = true;
    anonymousPreviewState.init();

    return () => {
      anonymousPreviewState.destroy();
    };
  });
</script>

<!--
  One left-aligned stack: eyebrow, headline, subline, composer.
  Nothing competes with it for the eye, and the app frame follows on the same
  column. The copy sits on the plain page; the app frame sits on a stage: a
  backdrop behind the frame's column (not a container around it,
  so everything keeps the nav's x), nearly edge to edge from lg with a 12px
  gutter, capped at 1920px. Its light gathers directly behind the frame, so
  the eye lands on the product.
-->
<!--
  The hero is the live demo, so "Live demo" links land on it. The scroll
  margin clears the sticky nav, which puts it at the very top of the page.
-->
<section
  id={HERO_ID}
  class={[
    'w-full scroll-mt-20 pb-12 lg:pb-16',
    { entering: !pageTransition.hasNavigated },
  ]}
>
  <header
    class="relative mx-auto flex w-full max-w-landing flex-col items-start px-4 pt-12 sm:px-6 lg:px-10 lg:pt-16"
  >
    <FoundersSocialProof />

    <!--
      One line from xl (both sentences fit the 1200px column at 64px), two
      below. Each sentence refuses to wrap inside itself, so the only break
      the browser can make is the one between them.
    -->
    <h1
      class="mt-6 text-[32px] leading-[1.04] font-medium tracking-[-0.03em] text-balance sm:text-[40px] lg:text-[56px] xl:text-[64px]"
    >
      <span class="whitespace-nowrap">Know your app broke.</span>
      <span class="text-neutral-600 whitespace-nowrap">
        Before your users do.
      </span>
    </h1>

    <p class="text-neutral-400 mt-6 max-w-3xl text-lg text-pretty sm:text-xl">
      Uptime monitoring for builders.
      <br class="lg:hidden" />
      Live in 30 seconds, no account needed.
    </p>

    <div class="mt-8 w-full max-w-xl">
      <HeroUrlForm source="hero" />

      {#if trialName}
        <p class="text-neutral-400 mt-3 pl-5 text-sm text-pretty">
          Add your website first. Your {trialName} trial starts when you claim the
          dashboard.
        </p>
      {/if}
    </div>
  </header>

  <div class="showcase relative w-full">
    <HeroStage />

    <HeroShowcase />
  </div>
</section>

<style>
  @keyframes enter {
    from {
      opacity: 0;
      translate: 0 var(--rise);
      filter: blur(var(--blur));
    }
    50% {
      translate: 0 0;
    }
  }

  .entering header > :global(*),
  .entering .showcase {
    animation: enter var(--duration) cubic-bezier(0.25, 1, 0.5, 1) var(--delay)
      backwards;
  }

  .entering header > :global(:nth-child(1)) {
    --rise: 0px;
    --blur: 4px;
    --duration: 1200ms;
    --delay: 250ms;
  }

  .entering header > :global(:nth-child(2)) {
    --rise: 4px;
    --blur: 12px;
    --duration: 1400ms;
    --delay: 0ms;
  }

  .entering header > :global(:nth-child(3)) {
    --rise: 3px;
    --blur: 10px;
    --duration: 1300ms;
    --delay: 150ms;
  }

  .entering header > :global(:nth-child(4)) {
    --rise: 3px;
    --blur: 8px;
    --duration: 1300ms;
    --delay: 300ms;
  }

  .entering .showcase {
    --rise: 6px;
    --blur: 10px;
    --duration: 1600ms;
    --delay: 450ms;
  }

  @keyframes fade {
    from {
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .entering header > :global(*),
    .entering .showcase {
      animation: fade 400ms ease backwards;
    }
  }
</style>
