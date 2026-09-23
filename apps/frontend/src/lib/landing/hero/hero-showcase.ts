import type { AnonymousPreviewPhase } from '$lib/domains/anonymous/application/anonymous-preview.state.svelte';

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
