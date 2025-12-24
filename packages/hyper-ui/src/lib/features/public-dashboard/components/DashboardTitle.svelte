<script lang="ts">
  import { onMount, onDestroy, type Snippet } from "svelte";
  import { fly } from "svelte/transition";

  interface Props {
    enablePolling?: boolean;
    pollingInterval?: number;
    onRefresh?: () => void;
    loading?: boolean;
    children?: Snippet;
  }

  let {
    enablePolling = false,
    pollingInterval = 60,
    onRefresh,
    loading = false,
    children,
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

<div class="mb-8 flex flex-col items-start justify-start px-1 text-left">
  <h1 class="text-secondary text-2xl font-semibold">
    {@render children?.()}
  </h1>
  {#if enablePolling}
    <div
      class="grid overflow-hidden text-left text-xs text-neutral-600 dark:text-neutral-500"
    >
      {#if loading}
        <span
          class="col-start-1 row-start-1 font-mono"
          in:fly={{ y: -12, duration: 200 }}
          out:fly={{ y: 12, duration: 200 }}
        >
          Refreshing...
        </span>
      {:else}
        <span
          class="col-start-1 row-start-1 font-mono"
          in:fly={{ y: -12, duration: 200 }}
          out:fly={{ y: 12, duration: 200 }}
        >
          Auto-refresh in {timeToNextRefresh}s
        </span>
      {/if}
    </div>
  {/if}
</div>
