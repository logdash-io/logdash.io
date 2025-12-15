<script lang="ts">
  import {
    animatedViewState,
    AnimationDirection,
  } from '$lib/domains/shared/ui/animated-view.state.svelte';
</script>

<div class="flex w-full flex-col gap-4 px-8 lg:w-fit lg:flex-row lg:px-0">
  <a
    draggable="false"
    href="/app/auth"
    class="btn btn-primary w-full lg:w-fit"
    onclick={() => {
      animatedViewState.nextAnimationDirection = AnimationDirection.RIGHT;
    }}
    data-posthog-id="hero-section-explore-features-cta"
  >
    Start free
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
