<script lang="ts">
  import { anonymousPreviewState } from '$lib/domains/anonymous/application/anonymous-preview.state.svelte';
  import FoundersSocialProof from '$lib/landing/social-proof/FoundersSocialProof.svelte';
  import { onMount } from 'svelte';
  import HeroShowcase from './HeroShowcase.svelte';
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
    <div
      class="hero-stage absolute inset-0 mx-auto max-w-[1920px] lg:inset-x-3 lg:rounded-2xl"
      aria-hidden="true"
    ></div>

    <HeroShowcase />
  </div>
</section>

<style>
  /*
    Stage: the frame's backdrop, from just above its top edge to just under
    its bottom one. The ramp is page colour where the frame begins and lights
    up down its height, so the visual weight sits behind the frame's lower
    half; the spot at the bottom centre pulls it to the middle, so the floor is
    brightest right under the product shot and
    darker at its sides. The mask fades the whole stage (ramp, noise, rounded
    shape) in from nothing over its top, so there is no seam or corner above
    the frame. The ::after layer is a tiled SVG noise at low opacity, there to
    dither the gradient so its 8-bit steps stop showing as bands on the dark
    ramp.
  */
  .hero-stage {
    --stage-fade-in: linear-gradient(180deg, transparent 0%, #000 40%);
    overflow: hidden;
    background:
      radial-gradient(
        56% 70% at 50% 100%,
        color-mix(in srgb, var(--color-base-content) 18%, transparent),
        transparent
      ),
      linear-gradient(
        180deg,
        var(--color-base-300) 8%,
        color-mix(in srgb, var(--color-base-content) 10%, var(--color-base-300))
          100%
      );
    -webkit-mask-image: var(--stage-fade-in);
    mask-image: var(--stage-fade-in);
  }

  .hero-stage::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size: 180px 180px;
    mix-blend-mode: soft-light;
    opacity: 0.5;
  }
</style>
