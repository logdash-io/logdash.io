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

  const projectId = $derived(page.url.searchParams.get('project_id'));

  const maxRetentionHours = $derived(
    exposedConfigState.logRetentionHours(userState.tier),
  );

  const defaultStartDate = $derived(
    new Date(Date.now() - maxRetentionHours * 60 * 60 * 1000),
  );

  let rendered = $state(false);

  onMount(() => {
    const timer = setTimeout(() => {
      rendered = true;
    }, 500);

    if (projectId) {
      logsState.sync(projectId);
    }

    return () => {
      clearTimeout(timer);
      logsState.unsync();
    };
  });

  $effect(() => {
    projectId;
    untrack(() => {
      filtersStore.reset();
      filtersStore.setFilters({
        startDate: defaultStartDate.toISOString(),
        endDate: null,
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
      logsState.refresh();
      return logAnalyticsState.sync(projectId);
    });

    return () => {
      cleanup();
    };
  });
</script>

<div class="flex flex-col">
  <LogsHeader {projectId} />

  <LogsVirtualList {projectId} logs={logsState.logs} {rendered} />
</div>
