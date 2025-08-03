<script lang="ts">
  import type { Snippet } from 'svelte';
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';

  type Props = {
    monitorId: string;
    children?: Snippet;
    onCaptureOnce?: () => void;
  };
  const { monitorId, children, onCaptureOnce }: Props = $props();
  const isHealthy = $derived(monitoringState.hasSuccessfulPing(monitorId));
  let notified = $state(false);

  $effect(() => {
    if (isHealthy && !notified) {
      notified = true;
      onCaptureOnce?.();
    }
  });
</script>

{#if isHealthy}
  {@render children?.()}
{:else}
  <div
    class="text-primary mx-auto flex items-center gap-2 font-semibold opacity-90"
  >
    <span class="loading loading-ring loading-xl"></span>
    Waiting for a healthy ping...
  </div>
{/if}
