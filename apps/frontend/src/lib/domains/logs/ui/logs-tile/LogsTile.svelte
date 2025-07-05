<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { logsState } from '$lib/domains/logs/application/logs.state.svelte.js';
  import LogsHeader from './header/LogsHeader.svelte';
  import LogsVirtualList from './LogsVirtualList.svelte';

  const projectId = $derived(page.url.searchParams.get('project_id'));

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
</script>

<div class="flex flex-col">
  <LogsHeader {projectId} />

  <LogsVirtualList logs={logsState.logs} {projectId} {rendered} />
</div>
