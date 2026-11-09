<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import type { Snippet } from 'svelte';
  import { tick } from 'svelte';
  import ChevronDownIcon from '$lib/domains/shared/icons/ChevronDownIcon.svelte';
  import SearchIcon from '$lib/domains/shared/icons/SearchIcon.svelte';
  import Footer from '$lib/landing/Footer.svelte';
  import PageView from '$lib/landing/PageView.svelte';
  import { Kbd } from '@logdash/hyper-ui/presentational';
  import DocsSearch from './DocsSearch.svelte';
  import DocsToc from './DocsToc.svelte';
  import { docsNav, docsNavEntries } from './documentation.data';

  type Props = {
    children: Snippet;
  };

  const { children }: Props = $props();

  let mobileOpen = $state(false);
  let searchOpen = $state(false);
  let shortcut = $state('⌘K');
  let article: HTMLElement | undefined = $state();
  let sidebar: HTMLElement | undefined = $state();

  const current = $derived(
    docsNavEntries.find((entry) => entry.href === page.url.pathname),
  );

  $effect(() => {
    if (!/Mac|iPhone|iPad/.test(navigator.userAgent)) {
      shortcut = 'Ctrl K';
    }
  });

  $effect(() => {
    void page.url.pathname;

    if (sidebar) {
      void revealCurrent(sidebar);
    }
  });

  async function revealCurrent(nav: HTMLElement): Promise<void> {
    await tick();
    const link = nav.querySelector<HTMLElement>('[aria-current="page"]');

    if (!link) return;

    const top = link.offsetTop - nav.offsetTop;
    const bottom = top + link.offsetHeight;

    if (top < nav.scrollTop || bottom > nav.scrollTop + nav.clientHeight) {
      nav.scrollTop = top - nav.clientHeight / 3;
    }
  }

  function onSearch(): void {
    mobileOpen = false;
    searchOpen = true;
  }
</script>

<!--
  One bounded frame: hairlines close it on
  both sides, sitting on the same x as the nav's logo and button (the column
  inset every landing cell uses), a sticky list of pages on the left, one
  column of prose in the middle and, from xl, the article's own headings on
  the right. Below md the page list folds into a row under the nav that
  names the current page.
-->
<div class="mx-auto w-full max-w-landing px-4 sm:px-6 lg:px-10">
  <div
    class="border-surface-root-border flex w-full flex-col border-x md:flex-row"
  >
    <aside
      class="border-surface-root-border hidden w-60 shrink-0 border-r md:block lg:w-64"
    >
      <div
        class="sticky top-16 flex max-h-[calc(100dvh-4rem)] flex-col px-4 lg:px-6"
      >
        <div class="pt-8 pb-3 lg:pt-10">
          <button
            type="button"
            onclick={onSearch}
            class="border-surface-root-border text-fg-muted hover:text-fg-secondary hover:bg-surface-root-hover-bg flex h-9 w-full items-center gap-2.5 rounded-lg border pr-1.5 pl-2.5 text-sm transition-ink duration-150"
          >
            <SearchIcon class="size-4 shrink-0" />
            Search docs
            <Kbd size="sm" class="text-fg-muted ml-auto">{shortcut}</Kbd>
          </button>
        </div>
        <nav
          bind:this={sidebar}
          aria-label="Docs"
          class="-mx-1 min-h-0 flex-1 overflow-y-auto px-1 pt-5 pb-8 lg:pb-10"
        >
          {@render groups()}
        </nav>
      </div>
    </aside>

    <div
      class="border-surface-root-border bg-surface-root-bg sticky top-16 z-10 border-b md:hidden"
    >
      <div class="flex items-center pr-2 sm:pr-4">
        <button
          type="button"
          class="flex min-w-0 flex-1 items-center gap-2 py-3 pl-4 text-left text-sm font-medium sm:pl-6"
          aria-expanded={mobileOpen}
          onclick={() => (mobileOpen = !mobileOpen)}
        >
          <span class="text-fg-muted shrink-0">{current?.group ?? 'Docs'}</span>
          <span class="text-fg-faint shrink-0">/</span>
          <span class="truncate">{current?.title ?? 'Docs'}</span>
          <ChevronDownIcon
            class={[
              'text-fg-muted size-4 shrink-0 transition-transform duration-200 ease-out',
              { 'rotate-180': mobileOpen },
            ]}
          />
        </button>
        <button
          type="button"
          aria-label="Search docs"
          onclick={onSearch}
          class="text-fg-muted hover:text-fg-default hover:bg-surface-root-hover-bg flex size-9 shrink-0 items-center justify-center rounded-lg transition-ink duration-150"
        >
          <SearchIcon class="size-4" />
        </button>
      </div>
      {#if mobileOpen}
        <nav
          aria-label="Docs"
          class="border-surface-root-border max-h-[calc(100dvh-7.25rem)] overflow-y-auto border-t px-4 py-5 sm:px-6"
        >
          {@render groups()}
        </nav>
      {/if}
    </div>

    <main
      bind:this={article}
      class="min-w-0 flex-1 px-4 py-10 sm:px-6 lg:px-10 lg:py-14 xl:px-12"
    >
      <!-- Only the article transitions between docs pages; the sidebar stays. -->
      <PageView keyOf={(url: URL) => url.pathname}>
        {@render children()}
      </PageView>
    </main>

    <aside class="ld-hairline-dashed-l hidden w-60 shrink-0 xl:block">
      <DocsToc container={article} />
    </aside>
  </div>
</div>

<Footer />

<DocsSearch bind:open={searchOpen} />

{#snippet groups()}
  <div class="flex flex-col gap-7">
    {#each docsNav as group (group.title)}
      <div class="flex flex-col gap-1">
        <h3 class="mb-1 px-2.5 text-sm font-medium">{group.title}</h3>
        <ul class="flex flex-col gap-px">
          {#each group.items as item (item.href)}
            {@const active = item.href === page.url.pathname}
            <li>
              <a
                href={resolve(item.href)}
                aria-current={active ? 'page' : undefined}
                onclick={() => (mobileOpen = false)}
                class={[
                  'flex min-h-8 items-center rounded-lg px-2.5 py-1.5 text-sm leading-5 transition-ink duration-150',
                  active
                    ? 'bg-surface-root-selected-bg text-fg-default'
                    : 'text-fg-tertiary hover:bg-surface-root-hover-bg hover:text-fg-default',
                ]}
              >
                {item.title}
              </a>
            </li>
          {/each}
        </ul>
      </div>
    {/each}
  </div>
{/snippet}
