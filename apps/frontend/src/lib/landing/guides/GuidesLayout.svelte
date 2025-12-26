<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { Tooltip } from '@logdash/hyper-ui/presentational';
  import { SDK_LIST } from '$lib/domains/logs/domain/sdk-config';
  import { documentationState } from './documentation.state.svelte';
  import { gettingStartedPages } from './documentation.data';
  import MenuIcon from '$lib/domains/shared/icons/MenuIcon.svelte';
  import OpenIcon from '$lib/domains/shared/icons/OpenIcon.svelte';
  import ChevronDownIcon from '$lib/domains/shared/icons/ChevronDownIcon.svelte';
  import Footer from '$lib/landing/Footer.svelte';

  interface Props {
    children: import('svelte').Snippet;
  }

  let { children }: Props = $props();

  function getPagePath(slug: string): string {
    return slug ? `/guides/${slug}` : '/guides';
  }

  function isActivePath(href: string): boolean {
    return page.url.pathname === href;
  }

  $effect(() => {
    documentationState.syncFromUrl(page.url);
  });

  function onSelectSDK(index: number, close: () => void): void {
    const newUrl = documentationState.buildUrlWithSDK(page.url, index);
    goto(newUrl, { replaceState: true, keepFocus: true });
    close();
  }
</script>

<div class="flex h-dvh w-full flex-col">
  <div class="relative flex w-full flex-1">
    {@render mobileMenuButton()}
    {@render mobileMenuOverlay()}

    <aside
      class={[
        'bg-base-300 fixed left-0 top-24 z-50 h-[calc(100vh-6rem)] w-64 shrink-0 overflow-y-auto border-r border-base-200 p-4 transition-transform md:sticky md:bg-transparent md:translate-x-0',
        {
          '-translate-x-full':
            !documentationState.mobileMenuOpen &&
            typeof window !== 'undefined' &&
            window.innerWidth < 768,
          'translate-x-0':
            documentationState.mobileMenuOpen ||
            (typeof window !== 'undefined' && window.innerWidth >= 768),
        },
      ]}
    >
      {@render sdkSelector()}
      {@render sidebarNav()}
    </aside>

    <main class="min-w-0 flex-1 overflow-y-auto px-6 py-8 lg:pl-8 lg:pr-4">
      <div class="relative">
        {@render children()}
      </div>
    </main>
  </div>
</div>

{#snippet sdkMenuItem(
  sdk: (typeof SDK_LIST)[number],
  index: number,
  close: () => void,
)}
  <li
    onclick={(e) => {
      e.stopPropagation();
      onSelectSDK(index, close);
    }}
    class={[
      'hover:bg-base-100/70 flex cursor-pointer select-none flex-row items-center justify-start gap-2.5 rounded-lg px-3 py-2 text-sm',
      { 'bg-base-100': index === documentationState.selectedSDKIndex },
    ]}
  >
    <sdk.icon class="h-4 w-4 shrink-0" />
    <span>{sdk.name}</span>
  </li>
{/snippet}

{#snippet sdkMenu(close: () => void)}
  <ul
    class="dropdown dropdown-center ld-card-base z-20 overflow-visible rounded-xl p-1.5 shadow-lg"
  >
    {#each SDK_LIST as sdk, index}
      {@render sdkMenuItem(sdk, index, close)}
    {/each}
  </ul>
{/snippet}

{#snippet sdkSelector()}
  <div class="mb-4 border-b border-base-200 pb-4">
    <Tooltip
      content={sdkMenu}
      interactive={true}
      placement="bottom"
      align="right"
      trigger="click"
    >
      <button
        class="btn btn-ghost btn-sm w-full justify-between gap-2 font-semibold"
      >
        <span class="flex items-center gap-2">
          <documentationState.selectedSDK.icon class="h-5 w-5 shrink-0" />
          <span>{documentationState.selectedSDK.name}</span>
        </span>
        <ChevronDownIcon class="h-4 w-4 shrink-0 opacity-50" />
      </button>
    </Tooltip>
  </div>
{/snippet}

{#snippet navLink(href: string, title: string, isActive: boolean)}
  <li>
    <a
      {href}
      onclick={() => documentationState.closeMobileMenu()}
      class={[
        'block rounded-lg px-3 py-1.5 text-sm transition-colors hover:bg-base-100',
        {
          'bg-base-200 font-medium text-primary': isActive,
          'text-base-content/70': !isActive,
        },
      ]}
    >
      {title}
    </a>
  </li>
{/snippet}

{#snippet externalNavLink(title: string, url: string)}
  <li>
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      class="flex items-center justify-between rounded-lg px-3 py-1.5 text-sm text-base-content/70 transition-colors hover:bg-base-100"
    >
      <span>{title}</span>
      <OpenIcon class="h-3 w-3 opacity-50" />
    </a>
  </li>
{/snippet}

{#snippet navSection(title: string)}
  <h3
    class="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-base-content/50"
  >
    {title}
  </h3>
{/snippet}

{#snippet sidebarNav()}
  <nav class="flex flex-col gap-6">
    <div>
      {@render navSection('Getting Started')}
      <ul class="flex flex-col gap-0.5">
        {#each gettingStartedPages as gettingStartedPage}
          {@const path = getPagePath(gettingStartedPage.slug)}
          {@render navLink(path, gettingStartedPage.title, isActivePath(path))}
        {/each}
      </ul>
    </div>

    <div>
      {@render navSection(`${documentationState.selectedSDK.name} SDK`)}
      <ul class="flex flex-col gap-0.5">
        {#each documentationState.sdkGuides as guide}
          {@render externalNavLink(guide.title, guide.externalUrl)}
        {/each}
      </ul>
    </div>

    {#if documentationState.internalGuides.length > 0}
      <div>
        {@render navSection('Migrate')}
        <ul class="flex flex-col gap-0.5">
          {#each documentationState.internalGuides as guide}
            {@render navLink(
              `/guides/${guide.slug}`,
              guide.title,
              isActivePath(`/guides/${guide.slug}`),
            )}
          {/each}
        </ul>
      </div>
    {/if}
  </nav>
{/snippet}

{#snippet mobileMenuButton()}
  <button
    class="btn btn-ghost btn-sm fixed left-4 top-28 z-40 md:hidden"
    onclick={() => documentationState.toggleMobileMenu()}
    aria-label="Toggle menu"
  >
    <MenuIcon class="h-5 w-5" />
  </button>
{/snippet}

{#snippet mobileMenuOverlay()}
  {#if documentationState.mobileMenuOpen}
    <div
      class="fixed inset-0 z-40 bg-black/50 md:hidden"
      onclick={() => documentationState.closeMobileMenu()}
      onkeydown={(e) =>
        e.key === 'Escape' && documentationState.closeMobileMenu()}
      role="button"
      tabindex="-1"
    ></div>
  {/if}
{/snippet}
