<script lang="ts">
  import {
    animatedViewState,
    AnimationDirection,
  } from '$lib/domains/shared/ui/animated-view.state.svelte';
</script>

<div class="flex w-full flex-col gap-4 px-8 sm:flex-row lg:w-fit lg:px-0">
  <a
    draggable="false"
    href="/features"
    class="btn btn-primary w-full lg:w-fit"
    onclick={() => {
      animatedViewState.nextAnimationDirection = AnimationDirection.RIGHT;
    }}
    data-posthog-id="hero-section-explore-features-cta"
  >
    Explore Features
  </a>

  <a
    href="/demo-dashboard"
    draggable="false"
    onclick={() => {
      animatedViewState.nextAnimationDirection = AnimationDirection.RIGHT;
    }}
    class="btn btn-secondary w-full lg:w-fit"
    data-posthog-id="hero-section-demo-dashboard-cta"
  >
    Live Demo
  </a>
</div>
