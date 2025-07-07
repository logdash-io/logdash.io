<script lang="ts">
  import { cubicInOut } from 'svelte/easing';
  import { fly, scale, type TransitionConfig } from 'svelte/transition';
  import {
    animatedViewState,
    AnimationDirection,
  } from '$lib/domains/shared/ui/animated-view.state.svelte.js';
  import type { Snippet } from 'svelte';
  import type { ClassValue } from 'svelte/elements';

  type Props = {
    class?: ClassValue;
    offsetRight?: string;
    children: Snippet;
  };
  const { class: className = '', offsetRight, children }: Props = $props();

  function introViewTransition(
    node: Element,
    direction: AnimationDirection,
  ): TransitionConfig {
    if (direction === AnimationDirection.LEFT) {
      return fly(node, {
        duration: 400,
        easing: cubicInOut,
        x: -10,
      });
    } else if (direction === AnimationDirection.RIGHT) {
      return fly(node, {
        duration: 400,
        easing: cubicInOut,
        x: 10,
      });
    } else if (direction === AnimationDirection.FRONT) {
      return scale(node, {
        duration: 400,
        start: 0.9,
        easing: cubicInOut,
      });
    } else if (direction === AnimationDirection.BACK) {
      return scale(node, {
        duration: 400,
        start: 0.9,
        easing: cubicInOut,
      });
    }
  }

  function outroViewTransition(
    node: Element,
    direction: AnimationDirection,
  ): TransitionConfig {
    if (direction === AnimationDirection.LEFT) {
      return fly(node, {
        duration: 400,
        easing: cubicInOut,
        x: 10,
      });
    } else if (direction === AnimationDirection.RIGHT) {
      return fly(node, {
        duration: 400,
        easing: cubicInOut,
        x: -10,
      });
    } else if (direction === AnimationDirection.FRONT) {
      return scale(node, {
        duration: 400,
        start: 1.1,
        easing: cubicInOut,
      });
    } else if (direction === AnimationDirection.BACK) {
      return scale(node, {
        duration: 400,
        start: 0.9,
        easing: cubicInOut,
      });
    }
  }
</script>

<div
  class="bg-base-300 absolute top-0 left-0 flex h-full w-full items-start"
  in:introViewTransition={animatedViewState.nextAnimationDirection}
  out:outroViewTransition={animatedViewState.nextAnimationDirection}
>
  <div class={[className]}>
    {@render children?.()}
  </div>

  {#if offsetRight}
    <div class={['h-dvh shrink-0', offsetRight]}></div>
  {/if}
</div>
