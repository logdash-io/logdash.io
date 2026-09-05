<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import type { Snippet } from 'svelte';
  import ChevronDownIcon from '$lib/domains/shared/icons/ChevronDownIcon.svelte';
  import OpenIcon from '$lib/domains/shared/icons/OpenIcon.svelte';
  import Footer from '$lib/landing/Footer.svelte';
  import PageView from '$lib/landing/PageView.svelte';
  import DocsToc from './DocsToc.svelte';
  import {
    docsSidebar,
    type DocsPath,
    type DocsSidebarItem,
  } from './documentation.data';

  type Props = {
    children: Snippet;
  };

  const { children }: Props = $props();

  let mobileOpen = $state(false);
  let article: HTMLElement | undefined = $state();

  const currentTitle = $derived(
    docsSidebar
      .flatMap((group) => group.items)
      .find((item) => !item.external && item.href === page.url.pathname)
      ?.title ?? 'Docs',
  );

  /** Narrowed up front: type guards do not survive into template closures. */
  function internalPath(item: DocsSidebarItem): DocsPath | null {
    return item.external === true ? null : item.href;
  }

  function isCurrent(item: DocsSidebarItem): boolean {
    return internalPath(item) === page.url.pathname;
  }

  function linkClass(current: boolean): string[] {
    return [
      'flex min-h-8 items-center gap-2.5 rounded-lg px-2.5 text-sm leading-5 transition-ink duration-150',
      current
        ? 'bg-neutral-900 text-base-content'
        : 'text-neutral-400 hover:text-base-content',
    ];
  }
</script>

<!--
  One bounded frame, the way a reference site reads: hairlines close it on
  both sides, sitting on the same x as the nav's logo and button (the column
  inset every landing cell uses), a sticky list of pages on the left, one
  column of prose in the middle and, from xl, the article's own headings on
  the right. Below md the page list folds into a row under the nav that
  names the current page.
-->
<div class="mx-auto w-full max-w-landing px-4 sm:px-6 lg:px-10">
  <div class="border-hairline flex w-full flex-col border-x md:flex-row">
    <aside
      class="border-hairline hidden w-60 shrink-0 border-r md:block lg:w-64"
    >
      <nav
        aria-label="Docs"
        class="sticky top-16 max-h-[calc(100dvh-4rem)] overflow-y-auto px-4 py-8 lg:px-6 lg:py-10"
      >
        {@render groups()}
      </nav>
    </aside>

    <div class="border-hairline border-b md:hidden">
      <button
        type="button"
        class="flex w-full items-center justify-between px-4 py-3 text-sm font-medium sm:px-6"
        aria-expanded={mobileOpen}
        onclick={() => (mobileOpen = !mobileOpen)}
      >
        <span class="flex items-center gap-2">
          <span class="text-neutral-500">Docs</span>
          <span class="text-neutral-600">/</span>
          <span>{currentTitle}</span>
        </span>
        <ChevronDownIcon
          class={[
            'text-neutral-500 size-4 transition-transform duration-200 ease-out',
            { 'rotate-180': mobileOpen },
          ]}
        />
      </button>
      {#if mobileOpen}
        <nav
          aria-label="Docs"
          class="border-hairline border-t px-4 py-5 sm:px-6"
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
      <PageView keyOf={(url) => url.pathname}>
        {@render children()}
      </PageView>
    </main>

    <aside class="ld-hairline-dashed-l hidden w-60 shrink-0 xl:block">
      <DocsToc container={article} />
    </aside>
  </div>
</div>

<div class="border-hairline w-full border-t">
  <Footer />
</div>

{#snippet groups()}
  <div class="flex flex-col gap-7">
    {#each docsSidebar as group (group.title)}
      <div class="flex flex-col gap-1">
        <h3 class="mb-1 px-2.5 text-sm font-medium">{group.title}</h3>
        <ul class="flex flex-col gap-px">
          {#each group.items as item (item.href)}
            <li>
              {@render sidebarLink(item)}
            </li>
          {/each}
        </ul>
      </div>
    {/each}
  </div>
{/snippet}

{#snippet sidebarLink(item: DocsSidebarItem)}
  {@const Icon = item.icon}
  {@const path = internalPath(item)}
  {#if !path}
    <!-- eslint-disable svelte/no-navigation-without-resolve -- external README -->
    <a
      href={item.href}
      target="_blank"
      rel="noopener noreferrer"
      class={linkClass(false)}
    >
      <!-- eslint-enable svelte/no-navigation-without-resolve -->
      {#if Icon}
        <Icon class="size-4 shrink-0" />
      {/if}
      <span>{item.title}</span>
      <OpenIcon class="text-neutral-600 ml-auto size-3 shrink-0" />
    </a>
  {:else}
    <a
      href={resolve(path)}
      class={linkClass(isCurrent(item))}
      aria-current={isCurrent(item) ? 'page' : undefined}
      onclick={() => (mobileOpen = false)}
    >
      {item.title}
    </a>
  {/if}
{/snippet}
