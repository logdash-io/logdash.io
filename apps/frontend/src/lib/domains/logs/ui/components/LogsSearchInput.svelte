<script lang="ts">
  import { logsState } from '$lib/domains/logs/application/logs.state.svelte.js';

  type Props = {
    projectId: string;
    tabId: string;
    onSearchChange?: (query: string, isSearching: boolean) => void;
  };

  const { projectId, tabId, onSearchChange }: Props = $props();

  let searchInput = $state('');
  let debounceTimer = $state<ReturnType<typeof setTimeout> | null>(null);

  function handleSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    searchInput = target.value;

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(async () => {
      const query = searchInput.trim();
      logsState.setSearchQuery(query);

      onSearchChange?.(query, query.length > 0);

      if (query) {
        await logsState.refreshLogsWithSearch(projectId, tabId);
      } else {
        await logsState.sync(projectId, tabId);
      }
    }, 300);
  }

  function clearSearch(): void {
    searchInput = '';
    logsState.clearSearch();
    onSearchChange?.('', false);
    logsState.sync(projectId, tabId);
  }
</script>

<div class="relative">
  <input
    bind:value={searchInput}
    class="ld-input ld-input-padding font-jetbrains w-full pr-10 text-sm"
    oninput={handleSearchInput}
    placeholder="Search logs..."
    type="text"
  />

  {#if searchInput}
    <button
      type="button"
      class="hover:bg-base-300 absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1 transition-colors"
      onclick={clearSearch}
    >
      <svg
        class="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 18L18 6M6 6l12 12"
        ></path>
      </svg>
    </button>
  {:else}
    <svg
      class="text-base-content/40 absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <circle cx="11" cy="11" r="8"></circle>
      <path d="m21 21-4.35-4.35"></path>
    </svg>
  {/if}
</div>
