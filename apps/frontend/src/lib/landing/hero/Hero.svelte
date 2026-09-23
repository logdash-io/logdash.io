<script lang="ts">
  import { anonymousPreviewState } from '$lib/domains/anonymous/application/anonymous-preview.state.svelte';
  import FoundersSocialProof from '$lib/landing/social-proof/FoundersSocialProof.svelte';
  import { onMount } from 'svelte';
  import HeroShowcase from './HeroShowcase.svelte';
  import HeroStage from './HeroStage.svelte';
  import HeroUrlForm from './HeroUrlForm.svelte';

  onMount(() => {
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
<section id="hero" class="w-full pb-12 lg:pb-16">
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
    </div>
  </header>

  <div class="relative w-full">
    <HeroStage />

    <HeroShowcase />
  </div>
</section>
