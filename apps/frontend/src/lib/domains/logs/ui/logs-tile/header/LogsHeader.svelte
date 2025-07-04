<script lang="ts">
  import { logsState } from '$lib/domains/logs/application/logs.state.svelte.js';
  import { scale } from 'svelte/transition';
  import LogsSearchInput from './LogsSearchInput.svelte';

  type Props = {
    projectId: string;
  };

  const { projectId }: Props = $props();

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

  function onSearchChange(query: string): void {
    logsState.setFilters({ searchString: query });
  }
</script>

<div class="bg-base-300 flex items-center justify-between gap-2.5 p-4">
  <div class="flex items-center gap-3">
    <div class="flex items-center gap-2">
      <span class="loading loading-ring loading-sm"></span>
    </div>
  </div>

  <LogsSearchInput {onSearchChange} />

  <button
    class="btn btn-secondary btn-outline btn-sm gap-1.5"
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
