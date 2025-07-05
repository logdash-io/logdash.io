<script lang="ts">
  import { logsState } from '$lib/domains/logs/application/logs.state.svelte.js';
  import { intersect } from '$lib/domains/shared/ui/actions/use-intersect.svelte.js';
  import { fade } from 'svelte/transition';
  import type { Log } from '$lib/domains/logs/domain/log';
  import EnhancedLogRow from './log-row/LogRow.svelte';

  type Props = {
    logs: Log[];
    rendered: boolean;
  };

  const { logs, rendered }: Props = $props();
  let virtualListRef = $state<HTMLDivElement | null>(null);
  let scrollTop = $state(0);

  function handleScroll(): void {
    if (virtualListRef) {
      scrollTop = virtualListRef.scrollTop;
    }
  }

  async function loadNextPage(): Promise<void> {
    if (logsState.pageIsLoading) return;
    await logsState.loadNextPage();
  }

  const scrolledFromTop = $derived(scrollTop > 0);
</script>

<div
  class="relative flex h-full max-h-[690px] w-full max-w-full flex-1 flex-col"
>
  {#if scrolledFromTop}
    <div
      class="pointer-events-none absolute top-0 left-0 z-10 -mt-1 h-12 w-full"
      style="
        background: linear-gradient(to right, var(--color-base-200) 0%, #0f0f0f 100%);
        mask: linear-gradient(to bottom, rgb(73 29 29) 0%, transparent 100%);
        -webkit-mask: linear-gradient(to bottom, rgb(73 29 29) 0%, transparent 100%);
      "
    ></div>
  {/if}

  <div
    class="styled-scrollbar flex h-full max-h-full w-full flex-col gap-1.5 overflow-auto overscroll-contain px-2 sm:gap-0"
    bind:this={virtualListRef}
    onscroll={handleScroll}
  >
    {#if logs.length === 0 && logsState.hasFilters}
      <div
        class="flex h-full w-full flex-col items-center justify-center gap-2 py-16"
      >
        <p class="text-base-content/40 text-sm">
          No logs found for the selected filters
        </p>
        <button
          class="btn btn-sm btn-secondary"
          onclick={() => {
            logsState.resetFilters();
          }}
        >
          Reset filters
        </button>
      </div>
    {/if}

    <div class="flex flex-col space-y-px">
      {#each logs as log, index (log.id)}
        <div
          in:fade|global={{
            duration: 300,
            delay: rendered ? 0 : index * 5,
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
    </div>

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

    {#if logsState.pageIsLoading}
      <div class="flex h-12 shrink-0 items-center justify-center gap-2">
        <span class="loading loading-spinner loading-sm opacity-80"></span>
      </div>
    {/if}
  </div>

  <div
    class="pointer-events-none absolute bottom-0 left-0 z-10 h-4 w-full"
    style="
      background: linear-gradient(to right, #111111 0%, var(--color-base-300) 100%);
      mask: linear-gradient(to top, rgb(73 29 29) 0%, transparent 100%);
      -webkit-mask: linear-gradient(to top, rgb(73 29 29) 0%, transparent 100%);"
  ></div>
</div>
