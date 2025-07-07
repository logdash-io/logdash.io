<script lang="ts">
  import { filtersStore } from '$lib/domains/logs/infrastructure/filters.store.svelte.js';
  import { untrack } from 'svelte';

  type Props = {
    onSearchChange?: (query: string) => void;
  };

  const { onSearchChange }: Props = $props();

  let debounceTimer = $state<ReturnType<typeof setTimeout> | null>(null);
  let localSearchTerm = $state<string>('');

  function handleSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    localSearchTerm = target.value;

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(async () => {
      const query = localSearchTerm.trim();

      onSearchChange?.(query);
    }, 300);
  }

  function clearSearch(): void {
    filtersStore.searchString = '';
    onSearchChange?.('');
  }

  $effect(() => {
    if (filtersStore.searchString !== untrack(() => localSearchTerm)) {
      localSearchTerm = filtersStore.searchString;
    }
  });
</script>

<div class="relative w-full">
  <input
    bind:value={localSearchTerm}
    class="ld-input ld-input-padding w-full pr-10 text-sm"
    oninput={handleSearchInput}
    placeholder="Search logs..."
    type="text"
  />

  {#if localSearchTerm}
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
