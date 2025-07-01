<script lang="ts">
  import { getContext, onMount } from 'svelte';
  import { page } from '$app/state';
  import { logsState } from '$lib/domains/logs/application/logs.state.svelte.js';
  import LogsListener from '$lib/domains/logs/ui/LogsListener.svelte';
  import LogsHeader from '$lib/domains/logs/ui/components/LogsHeader.svelte';
  import LogsSearchInput from '$lib/domains/logs/ui/components/LogsSearchInput.svelte';
  import LogsVirtualList from '$lib/domains/logs/ui/components/LogsVirtualList.svelte';

  const projectId = $derived(page.url.searchParams.get('project_id'));
  const tabId: string = getContext('tabId');

  let rendered = $state(false);
  let isSearching = $state(false);

  onMount(() => {
    const timer = setTimeout(() => {
      rendered = true;
    }, 500);

    if (projectId) {
      logsState.sync(projectId, tabId);
    }

    return () => {
      clearTimeout(timer);
      logsState.unsync();
    };
  });

  function handleSearchChange(query: string, searching: boolean): void {
    isSearching = searching;
  }
</script>

<LogsListener>
  <div class="flex flex-col gap-4">
    <LogsHeader {isSearching} {projectId} />

    <LogsSearchInput onSearchChange={handleSearchChange} {projectId} {tabId} />

    <LogsVirtualList logs={logsState.logs} {projectId} {rendered} />
  </div>
</LogsListener>
