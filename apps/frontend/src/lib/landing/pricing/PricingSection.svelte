<script>
  import { ArrowRightIcon } from 'lucide-svelte';
  import PricingGrid from './PricingGrid.svelte';
  import {
    animatedViewState,
    AnimationDirection,
  } from '$lib/domains/shared/ui/animated-view.state.svelte';
</script>

<div class="container mx-auto max-w-7xl px-4 gap-8">
  <header class="sm:mb-16 mb-8 text-center">
    <h1 class="mb-4 text-4xl font-bold tracking-tight">
      Pricing that matches your pace.
    </h1>

    <p class="text-base-content/70 mx-auto max-w-3xl text-xl">
      Validate your MVP for $0. Keep your burn rate low and upgrade only when
      you have revenue to protect, we'll have your back.
    </p>
  </header>

  <section class="max-w-5xl mx-auto">
    <PricingGrid />
  </section>

  <a
    href="/pricing#detailed-plans-comparison"
    onclick={() => {
      animatedViewState.nextAnimationDirection = AnimationDirection.RIGHT;
    }}
    class="btn btn-primary text-base-content btn-outline mx-auto mt-12 flex w-fit items-center gap-2 rounded-full font-normal"
  >
    Detailed comparison
    <ArrowRightIcon class="size-4" />
  </a>
</div>
