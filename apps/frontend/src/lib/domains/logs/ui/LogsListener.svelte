<script lang="ts">
  import { logsState } from '$lib/domains/logs/application/logs.state.svelte.js';
  import type { Snippet } from 'svelte';

  type Props = {
    children?: Snippet;
    onCaptureOnce?: () => void;
  };
  const { children, onCaptureOnce }: Props = $props();
  const hasLogs = $derived(logsState.logs.length > 0);
  let notified = $state(false);

  $effect(() => {
    if (hasLogs && !notified) {
      notified = true;
      onCaptureOnce?.();
    }
  });
</script>

{#if hasLogs}
  {@render children?.()}
{:else}
  <div
    class="text-primary mx-auto flex items-center gap-2 font-semibold opacity-90"
  >
    <span class="loading loading-ring loading-xl"></span>
    Waiting for logs...
  </div>
{/if}
