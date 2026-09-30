<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { LogsService } from '$lib/domains/logs/infrastructure/logs.service.js';
  import { filtersStore } from '$lib/domains/logs/infrastructure/filters.store.svelte.js';
  import { userState } from '$lib/domains/shared/user/application/user.state.svelte.js';

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
  let failed = $state(false);

  const errorLabel = $derived(
    `${errorCount}${errorCount === MAX_ERRORS ? '+' : ''} error${errorCount !== 1 ? 's' : ''} in 1h`,
  );

  async function fetchErrorCount(): Promise<void> {
    const oneHourAgo = new Date(Date.now() - ONE_HOUR_MS).toISOString();

    try {
      const logs = await LogsService.getProjectLogs(projectId, {
        levels: ['error'],
        startDate: oneHourAgo,
        limit: MAX_ERRORS,
      });
      errorCount = logs.length;
      failed = false;
    } catch {
      failed = true;
    } finally {
      loading = false;
    }
  }

  function onBadgeClick(): void {
    if (!clusterId) {
      return;
    }

    if (userState.id) {
      filtersStore.initPersistence(userState.id, projectId);
    }

    filtersStore.setLevels(['error']);
    void goto(
      resolve('/app/domains/[cluster_id]/[project_id]/logs', {
        cluster_id: clusterId,
        project_id: projectId,
      }),
    );
  }

  onMount(() => {
    void fetchErrorCount();
    const interval = setInterval(() => {
      void fetchErrorCount();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  });
</script>

{#if loading}
  <span class="text-neutral-600 font-mono text-xs">Checking errors</span>
{:else if failed}
  <span class="text-neutral-600 font-mono text-xs">Could not check errors</span>
{:else if errorCount > 0}
  <button
    type="button"
    onclick={onBadgeClick}
    class="text-error hover:decoration-error relative flex cursor-pointer items-center gap-1.5 font-mono text-xs underline decoration-transparent underline-offset-2 transition-ink duration-150"
  >
    <span class="bg-error size-1.5 shrink-0 rounded-full"></span>
    {errorLabel}
  </button>
{:else}
  <span class="text-neutral-500 font-mono text-xs">No errors in 1h</span>
{/if}
