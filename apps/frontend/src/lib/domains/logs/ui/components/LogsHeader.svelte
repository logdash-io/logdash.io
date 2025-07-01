<script lang="ts">
  import { logsState } from '$lib/domains/logs/application/logs.state.svelte.js';
  import { scale } from 'svelte/transition';

  type Props = {
    projectId: string;
    isSearching: boolean;
  };

  const { projectId, isSearching }: Props = $props();

  let sendingTestLogCooldown = $state(0);

  function sendTestLog(): void {
    sendingTestLogCooldown = 5;
    const interval = setInterval(() => {
      sendingTestLogCooldown--;
      if (sendingTestLogCooldown < 1) {
        clearInterval(interval);
      }
    }, 1000);
    logsState.sendTestLog(projectId);
  }

  const syncStatusText = $derived(
    isSearching
      ? 'Search active'
      : logsState.isConnected
        ? 'Live sync'
        : 'Disconnected',
  );

  const syncStatusIcon = $derived(
    isSearching ? 'pause' : logsState.isConnected ? 'sync' : 'disconnected',
  );
</script>

<div class="flex items-center justify-between gap-4">
  <div class="flex items-center gap-3">
    <div class="flex items-center gap-2">
      {#if syncStatusIcon === 'sync'}
        <div class="animate-spin">
          <svg
            class="text-success h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </div>
      {:else if syncStatusIcon === 'pause'}
        <svg
          class="text-warning h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      {:else}
        <svg
          class="text-error h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"
          />
        </svg>
      {/if}

      <h2 class="font-semibold">Project logs</h2>
    </div>

    <span class="text-base-content/60 font-mono text-xs">
      {syncStatusText}
    </span>
  </div>

  <button
    class="btn btn-primary btn-xs gap-1.5"
    data-posthog-id="send-test-log-button"
    disabled={sendingTestLogCooldown > 0}
    onclick={sendTestLog}
  >
    <span>Send test log</span>
    {#if sendingTestLogCooldown > 0}
      <span class="font-mono" in:scale|global={{ start: 0.8, duration: 200 }}>
        ({sendingTestLogCooldown}s)
      </span>
    {/if}
  </button>
</div>
