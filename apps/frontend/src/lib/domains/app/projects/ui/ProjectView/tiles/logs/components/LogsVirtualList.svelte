<script lang="ts">
  import { logsState } from '$lib/domains/app/projects/application/logs.state.svelte.js';
  import { intersect } from '$lib/domains/shared/ui/actions/use-intersect.svelte.js';
  import { fade } from 'svelte/transition';
  import type { Log } from '$lib/domains/app/projects/domain/log';
  import EnhancedLogRow from '$lib/domains/app/projects/ui/ProjectView/tiles/logs/components/EnhancedLogRow.svelte';

  type Props = {
    projectId: string;
    logs: Log[];
    rendered: boolean;
  };

  const { projectId, logs, rendered }: Props = $props();

  async function loadNextPage(): Promise<void> {
    if (logsState.pageIsLoading) return;
    await logsState.loadNextPage(projectId);
  }
</script>

<div class="relative flex h-full max-h-[690px] flex-1 flex-col overflow-hidden">
  <div
    class="styled-scrollbar flex h-full max-h-full flex-col gap-1.5 overflow-auto sm:gap-0"
  >
    {#each logs as log, index (log.id)}
      <div
        in:fade|global={{
          duration: 800,
          delay: rendered ? 0 : index * 150,
        }}
      >
        <EnhancedLogRow
          {index}
          date={log.createdAt}
          level={log.level}
          message={log.message}
        />
      </div>
    {/each}

    <div
      class="h-0.5 w-full shrink-0"
      use:intersect={{
        callback: ({ isIntersecting }) => {
          if (isIntersecting) {
            loadNextPage();
          }
        },
      }}
    ></div>

    <div class="flex h-12 shrink-0 items-center justify-center gap-2">
      {#if logsState.pageIsLoading}
        <span class="loading loading-spinner loading-sm opacity-80"></span>
      {/if}
    </div>
  </div>
</div>
