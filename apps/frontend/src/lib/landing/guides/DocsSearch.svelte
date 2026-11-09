<script lang="ts">
  import { resolve } from '$app/paths';
  import ChevronRightIcon from '$lib/domains/shared/icons/ChevronRightIcon.svelte';
  import HashIcon from '$lib/domains/shared/icons/HashIcon.svelte';
  import LogsIcon from '$lib/domains/shared/icons/LogsIcon.svelte';
  import SearchIcon from '$lib/domains/shared/icons/SearchIcon.svelte';
  import Modal from '$lib/domains/shared/ui/Modal.svelte';
  import {
    highlight,
    searchDocs,
    type SearchEntry,
    type SearchResult,
  } from '$lib/landing/docs/docs-search';
  import { Kbd } from '@logdash/hyper-ui/presentational';
  import { match } from 'ts-pattern';
  import { docsNav } from './documentation.data';

  type Props = {
    open: boolean;
  };

  let { open = $bindable() }: Props = $props();

  const id = $props.id();

  const SUGGESTIONS: SearchResult[] = docsNav.map((group) => ({
    href: group.items[0].href,
    group: group.title,
    page: group.items[0].title,
    text: '',
    snippet: '',
  }));

  let query = $state('');
  let index: SearchEntry[] | null = $state.raw(null);
  let failed = $state(false);
  let active = $state(0);
  let list: HTMLElement | undefined = $state();

  const searching = $derived(query.trim() !== '');
  const results = $derived(
    searching ? (index ? searchDocs(index, query) : []) : SUGGESTIONS,
  );

  $effect(() => {
    if (open) {
      void loadIndex();
    }
  });

  $effect(() => {
    void results;
    active = 0;
  });

  async function loadIndex(): Promise<void> {
    if (index) return;

    try {
      const response = await fetch(resolve('/docs/search.json'));

      if (!response.ok) {
        throw new Error(`Search index answered ${response.status}`);
      }

      index = (await response.json()) as SearchEntry[];
      failed = false;
    } catch {
      failed = true;
    }
  }

  function onWindowKeydown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      open = !open;
      return;
    }

    if (event.key === '/' && !open && !isTyping(event.target)) {
      event.preventDefault();
      open = true;
    }
  }

  function onInputKeydown(event: KeyboardEvent): void {
    match(event.key)
      .with('ArrowDown', () => {
        event.preventDefault();
        onMove(1);
      })
      .with('ArrowUp', () => {
        event.preventDefault();
        onMove(-1);
      })
      .with('Enter', () => {
        const option = list?.querySelector<HTMLAnchorElement>(
          `[data-index="${active}"]`,
        );

        if (!option) return;

        event.preventDefault();
        option.click();
      })
      .with('Escape', () => {
        event.preventDefault();
        onClose();
      })
      .otherwise(() => undefined);
  }

  function onMove(step: number): void {
    if (results.length === 0) return;

    active = (active + step + results.length) % results.length;
    list
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }

  function onClose(): void {
    open = false;
    query = '';
  }

  function target(result: SearchResult): { path: '/'; hash: string } {
    const [path, hash] = result.href.split('#');

    return { path: path as '/', hash: hash ? `#${hash}` : '' };
  }

  function isTyping(target: EventTarget | null): boolean {
    return (
      target instanceof HTMLElement &&
      (target.isContentEditable ||
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
    );
  }
</script>

<svelte:window onkeydown={onWindowKeydown} />

<Modal
  isOpen={open}
  {onClose}
  aria-labelledby="{id}-label"
  class="mt-[12dvh] mb-auto flex max-h-[min(36rem,76dvh)] w-xl flex-col overflow-hidden p-0"
>
  <div
    class="border-surface-elevated-border flex h-13 shrink-0 items-center gap-3 border-b px-4"
  >
    <SearchIcon class="text-fg-muted size-4 shrink-0" />
    <label id="{id}-label" for="{id}-input" class="sr-only">Search docs</label>
    <input
      id="{id}-input"
      bind:value={query}
      onkeydown={onInputKeydown}
      type="search"
      role="combobox"
      aria-expanded={results.length > 0}
      aria-controls="{id}-results"
      aria-activedescendant={results[active]
        ? `${id}-result-${active}`
        : undefined}
      aria-autocomplete="list"
      autocomplete="off"
      spellcheck="false"
      placeholder="Search docs"
      class="placeholder:text-fg-muted h-full min-w-0 flex-1 bg-transparent text-[15px] outline-none [&::-webkit-search-cancel-button]:hidden"
    />
    <Kbd size="sm" class="text-fg-muted shrink-0">esc</Kbd>
  </div>

  <div bind:this={list} class="min-h-0 flex-1 overflow-y-auto p-2">
    {#if searching && failed}
      {@render status(
        'Search could not load. Check your connection and try again.',
      )}
    {:else if searching && !index}
      {@render status('Loading the docs…')}
    {:else if results.length === 0}
      {@render status(`No results for “${query.trim()}”`)}
    {:else}
      {#if !searching}
        <p class="text-fg-muted px-3 pt-2 pb-1.5 text-xs font-medium">
          Jump to
        </p>
      {/if}
      <div id="{id}-results" role="listbox" aria-label="Results">
        {#each results as result, resultIndex (result.href)}
          {@const Icon = result.heading ? HashIcon : LogsIcon}
          {@const link = target(result)}
          <a
            id="{id}-result-{resultIndex}"
            data-index={resultIndex}
            href="{resolve(link.path)}{link.hash}"
            role="option"
            aria-selected={resultIndex === active}
            tabindex="-1"
            onclick={onClose}
            onmousemove={() => (active = resultIndex)}
            class="aria-selected:bg-surface-elevated-hover-bg flex items-start gap-3 rounded-lg px-3 py-2.5"
          >
            <span
              class="border-surface-elevated-border text-fg-muted mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border"
            >
              <Icon class="size-3.5" />
            </span>
            <span class="flex min-w-0 flex-1 flex-col gap-0.5">
              <span
                class="text-fg-muted flex min-w-0 items-center gap-1 text-xs"
              >
                <span class="truncate">{result.group}</span>
                {#if result.heading}
                  <ChevronRightIcon class="text-fg-faint size-3 shrink-0" />
                  <span class="truncate">{result.page}</span>
                {/if}
              </span>
              <span class="text-fg-default truncate text-sm font-medium">
                {@render marked(result.heading ?? result.page)}
              </span>
              {#if result.snippet}
                <span class="text-fg-tertiary line-clamp-2 text-xs leading-5">
                  {@render marked(result.snippet)}
                </span>
              {/if}
            </span>
          </a>
        {/each}
      </div>
    {/if}
  </div>

  <div
    class="border-surface-elevated-border text-fg-muted flex h-10 shrink-0 items-center gap-4 border-t px-4 text-xs"
    aria-hidden="true"
  >
    <span class="flex items-center gap-1.5">
      <Kbd size="sm">↑</Kbd>
      <Kbd size="sm">↓</Kbd>
      to move
    </span>
    <span class="flex items-center gap-1.5">
      <Kbd size="sm">↵</Kbd>
      to open
    </span>
  </div>
</Modal>

{#snippet status(text: string)}
  <p class="text-fg-muted px-3 py-10 text-center text-sm" role="status">
    {text}
  </p>
{/snippet}

{#snippet marked(text: string)}
  {#each highlight(text, query) as part, partIndex (partIndex)}
    {#if part.match}
      <mark class="text-fg-default bg-transparent underline underline-offset-2">
        {part.text}
      </mark>
    {:else}
      {part.text}
    {/if}
  {/each}
{/snippet}
