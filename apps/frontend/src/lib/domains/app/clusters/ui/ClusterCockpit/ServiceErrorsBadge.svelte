<script lang="ts">
  import { onMount } from 'svelte';
  import { LogsService } from '$lib/domains/logs/infrastructure/logs.service.js';
  import DangerIcon from '$lib/domains/shared/icons/DangerIcon.svelte';
  import CheckIcon from '$lib/domains/shared/icons/CheckIcon.svelte';

  type Props = {
    projectId: string;
  };

  const { projectId }: Props = $props();

  const POLL_INTERVAL_MS = 60 * 1000;
  const ONE_HOUR_MS = 60 * 60 * 1000;
  const MAX_ERRORS = 100;

  let errorCount = $state(0);
  let loading = $state(true);

  const errorLabel = $derived(
    `${errorCount}${errorCount === MAX_ERRORS ? '+' : ''} error${errorCount !== 1 ? 's' : ''} (1h)`,
  );

  async function fetchErrorCount(): Promise<void> {
    loading = true;
    const oneHourAgo = new Date(Date.now() - ONE_HOUR_MS).toISOString();

    try {
      const logs = await LogsService.getProjectLogs(projectId, {
        level: 'error',
        startDate: oneHourAgo,
        limit: MAX_ERRORS,
      });
      errorCount = logs.length;
    } catch {
      errorCount = 0;
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    fetchErrorCount();
    const interval = setInterval(fetchErrorCount, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  });
</script>

{#if loading}
  <div class="size-6 flex items-center justify-center">
    <div class="loading loading-spinner w-3.5 text-base-content/60"></div>
  </div>
{:else if errorCount > 0}
  <div class="flex items-center gap-1.5 rounded-lg bg-error/10 px-2 py-1">
    <DangerIcon class="size-3 text-error" />
    <span class="text-xs text-error">{errorLabel}</span>
  </div>
{:else}
  <div class="flex items-center gap-1.5 rounded-lg bg-success/10 px-2 py-1">
    <CheckIcon class="size-3 text-success" />
    <span class="text-xs text-success">No errors (1h)</span>
  </div>
{/if}
