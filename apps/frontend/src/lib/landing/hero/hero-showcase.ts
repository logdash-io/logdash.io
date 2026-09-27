import type { AnonymousPreviewPhase } from '$lib/domains/anonymous/application/anonymous-preview.state.svelte';
import { cubicOut } from 'svelte/easing';
import { prefersReducedMotion } from 'svelte/motion';
import { fade, type TransitionConfig } from 'svelte/transition';

const SHOWCASE_SWAP_MS = 200;

/**
 * Until a visitor starts their own preview the frame shows Logdash's own
 * production service. Once they do, it shows their fresh account, which has
 * one service and no logs or metrics yet.
 */
export function showsVisitorAccount(phase: AnonymousPreviewPhase): boolean {
  return phase === 'creating' || phase === 'previewing' || phase === 'ended';
}

export function showcaseClusterName(phase: AnonymousPreviewPhase): string {
  return showsVisitorAccount(phase) ? 'My first cluster' : 'Logdash';
}

export function showcaseSwap(
  node: Element,
  { delay = 0 }: { delay?: number } = {},
): TransitionConfig {
  return fade(node, {
    duration: SHOWCASE_SWAP_MS,
    delay: prefersReducedMotion.current ? 0 : delay,
    easing: cubicOut,
  });
}
