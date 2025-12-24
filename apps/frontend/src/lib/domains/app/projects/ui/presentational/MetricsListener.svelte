<script lang="ts">
  import { metricsState } from '$lib/domains/app/projects/application/metrics.state.svelte.js';
  import type { Snippet } from 'svelte';

  type Props = {
    children?: Snippet;
    onCaptureOnce?: () => void;
    showWaitingState?: boolean;
  };
  const { children, onCaptureOnce, showWaitingState = false }: Props = $props();
  const hasMetrics = $derived(metricsState.simplifiedMetrics.length > 0);
  let notified = $state(false);

  $effect(() => {
    if (hasMetrics && !notified) {
      notified = true;
      onCaptureOnce?.();
    }
  });
</script>

{#if showWaitingState && !hasMetrics}
  <div
    class="text-primary mx-auto flex items-center gap-2 font-semibold opacity-90"
  >
    <span class="loading loading-ring loading-xl"></span>
    Waiting for metrics...
  </div>
{:else}
  {@render children?.()}
{/if}
