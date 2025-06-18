<script lang="ts">
  import { onMount, onDestroy, type Snippet } from 'svelte';

  interface Props {
    enablePolling?: boolean;
    pollingInterval?: number;
    onRefresh?: () => void;
    children: Snippet;
    loading?: boolean;
  }

  let {
    enablePolling = false,
    pollingInterval = 60,
    onRefresh,
    children,
    loading = false,
  }: Props = $props();

  let timeToNextRefresh = $state(pollingInterval);
  let pollingIntervalId: ReturnType<typeof setInterval> | null = null;
  let countdownIntervalId: ReturnType<typeof setInterval> | null = null;

  function startPolling() {
    if (!enablePolling || !onRefresh) return;

    timeToNextRefresh = pollingInterval;

    countdownIntervalId = setInterval(() => {
      timeToNextRefresh--;
      if (timeToNextRefresh <= 0) {
        timeToNextRefresh = pollingInterval;
      }
    }, 1000);

    pollingIntervalId = setInterval(() => {
      onRefresh?.();
      timeToNextRefresh = pollingInterval;
    }, pollingInterval * 1000);
  }

  function stopPolling() {
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
      pollingIntervalId = null;
    }
    if (countdownIntervalId) {
      clearInterval(countdownIntervalId);
      countdownIntervalId = null;
    }
  }

  onMount(() => {
    if (enablePolling) {
      startPolling();
    }
  });

  onDestroy(() => {
    stopPolling();
  });

  $effect(() => {
    stopPolling();
    if (enablePolling && !loading) {
      startPolling();
    }
  });
</script>

<div class="mb-8 flex items-center justify-between px-1 text-center">
  <h1 class="text-secondary text-2xl font-semibold">
    {@render children()}
  </h1>
  {#if enablePolling}
    <div
      class="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-300"
    >
      {#if loading}
        <div class="loading-spinner loading loading-xs"></div>
      {/if}
      <span class="font-mono">Auto-refresh in {timeToNextRefresh}s</span>
    </div>
  {/if}
</div>
