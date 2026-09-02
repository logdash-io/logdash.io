<script lang="ts">
  import { anonymousPreviewState } from '$lib/domains/anonymous/application/anonymous-preview.state.svelte';
  import FoundersSocialProof from '$lib/landing/FoundersSocialProof.svelte';
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

<header class="flex w-full flex-col gap-10 pt-8 sm:gap-14 sm:pt-12 lg:pt-16">
  <div class="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
    <div class="hero-copy flex flex-col items-start gap-6 lg:col-span-7">
      <FoundersSocialProof />

      <h1
        class="text-5xl leading-[0.95] font-extrabold tracking-tighter sm:text-6xl lg:text-7xl"
      >
        Know your app broke.
        <br />
        <span class="text-primary">Before your users do.</span>
      </h1>
    </div>

    <div
      class="hero-copy flex flex-col gap-4 lg:col-span-5 lg:self-end lg:pb-1"
    >
      <p class="text-base-content/70 text-lg leading-relaxed">
        Uptime monitoring, logs and metrics for SaaS founders. Live in 30
        seconds. No account needed.
      </p>

      <HeroUrlForm source="hero" />

      <p class="text-base-content/45 text-sm">
        No signup · No credit card · Claim later with GitHub or Google
      </p>
    </div>
  </div>

  <div class="hero-visual w-full">
    <HeroShowcase />
  </div>
</header>

<style>
  @keyframes hero-in {
    from {
      opacity: var(--hero-fade-from, 0);
      translate: 0 var(--hero-rise, 0px);
      filter: blur(var(--hero-blur, 0px));
    }
    to {
      opacity: 1;
      translate: 0 0;
      filter: blur(0px);
    }
  }

  .hero-copy > :global(*) {
    --hero-rise: 4px;
    animation: hero-in 1.6s cubic-bezier(0.25, 1, 0.5, 1) backwards;
  }

  .hero-copy > :global(*:nth-child(1)) {
    --hero-blur: 6px;
  }

  .hero-copy > :global(*:nth-child(2)) {
    --hero-blur: 4px;
    animation-delay: 150ms;
  }

  .hero-copy > :global(*:nth-child(3)) {
    --hero-rise: 3px;
    animation-duration: 1.5s;
    animation-delay: 300ms;
  }

  .hero-visual {
    --hero-rise: 6px;
    --hero-blur: 6px;
    animation: hero-in 1.9s cubic-bezier(0.25, 1, 0.5, 1) 250ms backwards;
  }

  @media (prefers-reduced-motion: reduce) {
    .hero-copy > :global(*:nth-child(n)),
    .hero-visual {
      --hero-rise: 0px;
      --hero-blur: 0px;
      animation-duration: 0.4s;
      animation-delay: 0ms;
    }
  }
</style>
