<script lang="ts">
  import { metricsState } from '$lib/domains/app/projects/application/metrics.state.svelte.js';
  import { Spinner } from '@logdash/hyper-ui/presentational';
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
  <div class="text-brand mx-auto flex items-center gap-2 font-medium">
    <Spinner variant="ring" size="xl" aria-hidden="true" />
    Waiting for metrics...
  </div>
{:else}
  {@render children?.()}
{/if}
