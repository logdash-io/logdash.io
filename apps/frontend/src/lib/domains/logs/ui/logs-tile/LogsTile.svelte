<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { page } from '$app/state';
  import { logsState } from '$lib/domains/logs/application/logs.state.svelte.js';
  import LogsHeader from './header/LogsHeader.svelte';
  import LogsVirtualList from './LogsVirtualList.svelte';
  import { logAnalyticsState } from '../../application/log-analytics.state.svelte.js';
  import { filtersStore } from '../../infrastructure/filters.store.svelte.js';
  import { exposedConfigState } from '$lib/domains/shared/exposed-config/application/exposed-config.state.svelte.js';
  import { userState } from '$lib/domains/shared/user/application/user.state.svelte.js';

  type Props = {
    priorityProjectId?: string;
  };

  const { priorityProjectId }: Props = $props();

  const projectId = $derived(priorityProjectId ?? page.params.project_id);
  const userId = $derived(userState.id);

  const maxRetentionHours = $derived(
    exposedConfigState.logRetentionHours(userState.tier),
  );

  const defaultStartDate = $derived(
    new Date(Date.now() - maxRetentionHours * 60 * 60 * 1000),
  );

  let rendered = $state(false);
  let hasSynced = false;

  onMount(() => {
    const timer = setTimeout(() => {
      rendered = true;
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  });

  $effect(() => {
    projectId;
    untrack(() => {
      if (userId && projectId) {
        filtersStore.initPersistence(userId, projectId);
      }
      filtersStore.setFilters({
        startDate: filtersStore.startDate || defaultStartDate.toISOString(),
        endDate: filtersStore.endDate || null,
        defaultStartDate: defaultStartDate.toISOString(),
      });
    });
  });

  $effect(() => {
    filtersStore.filters;
    if (!projectId) {
      return;
    }

    const cleanup = untrack(() => {
      logsState.resync(projectId, !hasSynced);
      hasSynced = true;
      return logAnalyticsState.sync(projectId);
    });

    return () => {
      cleanup();
      logsState.unsync();
    };
  });
</script>

<div class="flex flex-col min-h-[35rem]">
  <LogsHeader {projectId} />

  <LogsVirtualList logs={logsState.logs} {rendered} />
</div>
