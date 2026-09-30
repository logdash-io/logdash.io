<script lang="ts">
  import GridIcon from '$lib/domains/shared/icons/GridIcon.svelte';
  import Logotype from '$lib/domains/shared/icons/Logotype.svelte';
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';
  import type { Snippet } from 'svelte';
  import SidebarMenuItem from './SidebarMenuItem.svelte';

  type Props = {
    homeHref?: string;
    homeActive?: boolean;
    showLogo?: boolean;
    addDomainHref?: string;
    onAddDomain?: () => void;
    list?: HTMLElement | null;
    children: Snippet;
    footer: Snippet;
  };

  let {
    homeHref,
    homeActive = false,
    showLogo = true,
    addDomainHref,
    onAddDomain,
    list = $bindable(null),
    children,
    footer,
  }: Props = $props();

  const ADD_DOMAIN_CLASS =
    'hover:bg-surface-hover hover:text-fg-default flex size-5 cursor-pointer items-center justify-center rounded-md opacity-0 group-hover:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100';
</script>

<div class="flex min-h-0 flex-1 flex-col">
  {#if showLogo}
    <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- href is supplied by the caller -->
    <a href={homeHref} class="flex h-14 shrink-0 items-center px-4">
      <Logotype class="text-[17px]" />
    </a>
  {/if}

  <div class="flex min-h-0 flex-1 flex-col gap-4 px-2 pt-1">
    <SidebarMenuItem href={homeHref} isActive={homeActive}>
      <GridIcon class="size-4 shrink-0" />
      <span class="truncate">All domains</span>
    </SidebarMenuItem>

    <nav
      bind:this={list}
      class="flex min-h-0 flex-col gap-px overflow-y-auto pb-6 [mask-image:linear-gradient(to_bottom,black_calc(100%_-_1.5rem),transparent)]"
      aria-label="Domains"
    >
      <div
        class="group text-neutral-500 flex h-7 shrink-0 items-center justify-between px-2 text-xs"
      >
        <span>Domains</span>
        {#if addDomainHref}
          <!-- eslint-disable svelte/no-navigation-without-resolve -- href is supplied by the caller -->
          <a
            href={addDomainHref}
            class={ADD_DOMAIN_CLASS}
            aria-label="Add domain"
            title="Add domain"
          >
            <PlusIcon class="size-3.5" />
          </a>
          <!-- eslint-enable svelte/no-navigation-without-resolve -->
        {:else if onAddDomain}
          <button
            type="button"
            class={ADD_DOMAIN_CLASS}
            aria-label="Add domain"
            title="Add domain"
            onclick={onAddDomain}
          >
            <PlusIcon class="size-3.5" />
          </button>
        {/if}
      </div>

      {@render children()}
    </nav>
  </div>

  {@render footer()}
</div>
