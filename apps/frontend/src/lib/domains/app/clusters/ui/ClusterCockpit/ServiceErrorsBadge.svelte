<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { LogsService } from '$lib/domains/logs/infrastructure/logs.service.js';
  import { filtersStore } from '$lib/domains/logs/infrastructure/filters.store.svelte.js';
  import { DangerIcon, CheckIcon } from '@logdash/hyper-ui/icons';

  type Props = {
    projectId: string;
  };

  const { projectId }: Props = $props();

  const POLL_INTERVAL_MS = 60 * 1000;
  const ONE_HOUR_MS = 60 * 60 * 1000;
  const MAX_ERRORS = 100;

  const clusterId = $derived(page.params.cluster_id);

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
        levels: ['error'],
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

  function onBadgeClick(e: MouseEvent): void {
    e.stopPropagation();
    filtersStore.setLevels(['error']);
    goto(
      resolve('/app/clusters/[cluster_id]/[project_id]/logs', {
        cluster_id: clusterId,
        project_id: projectId,
      }),
    );
  }

  onMount(() => {
    fetchErrorCount();
    const interval = setInterval(fetchErrorCount, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  });
</script>

{#if loading}
  <div class="size-6 flex items-center justify-center">
    <div class="loading loading-spinner w-3.5 text-neutral-400"></div>
  </div>
{:else if errorCount > 0}
  <button
    onclick={onBadgeClick}
    class="flex items-center gap-1.5 rounded-lg bg-error/10 px-2 py-1 hover:bg-error/20 cursor-pointer"
  >
    <DangerIcon class="size-3 text-error" />
    <span class="text-xs text-error">{errorLabel}</span>
  </button>
{:else}
  <div class="flex items-center gap-1.5 rounded-lg bg-success/10 px-2 py-1">
    <CheckIcon class="size-3 text-success" />
    <span class="text-xs text-success">No errors (1h)</span>
  </div>
{/if}
