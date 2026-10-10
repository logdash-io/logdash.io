<script lang="ts">
  import ChevronDownIcon from '$lib/domains/shared/icons/ChevronDownIcon.svelte';
  import ChevronRightIcon from '$lib/domains/shared/icons/ChevronRightIcon.svelte';
  import GridIcon from '$lib/domains/shared/icons/GridIcon.svelte';
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';
  import { Tooltip } from '@logdash/hyper-ui/presentational';
  import type { Snippet } from 'svelte';
  import SidebarMenuItem from './SidebarMenuItem.svelte';

  type Props = {
    homeHref?: string;
    homeActive?: boolean;
    addDomainHref?: string;
    onAddDomain?: () => void;
    list?: HTMLElement | null;
    children: Snippet;
    header?: Snippet;
    footer: Snippet;
  };

  let {
    homeHref,
    homeActive = false,
    addDomainHref,
    onAddDomain,
    list = $bindable(null),
    children,
    header,
    footer,
  }: Props = $props();

  let domainsOpen = $state(true);

  const ADD_DOMAIN_CLASS =
    'hover:bg-surface-root-hover-bg hover:text-fg-default flex size-5.5 cursor-pointer items-center justify-center rounded-md opacity-0 group-hover:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100';
</script>

<div class="flex min-h-0 flex-1 flex-col">
  {#if header}
    <div class="flex h-14 shrink-0 items-center px-3 pt-2">
      {@render header()}
    </div>
  {/if}

  <div class="flex min-h-0 flex-1 flex-col gap-4 px-3 pt-1">
    <SidebarMenuItem href={homeHref} isActive={homeActive}>
      <GridIcon class="size-4 shrink-0" />
      <span class="truncate">All domains</span>
    </SidebarMenuItem>

    <nav
      bind:this={list}
      class="flex min-h-0 flex-col gap-0.5 overflow-y-auto pb-6 [mask-image:linear-gradient(to_bottom,black_calc(100%_-_1.5rem),transparent)]"
      aria-label="Domains"
    >
      <div
        class="group text-fg-tertiary flex h-7.5 shrink-0 items-center justify-between pr-2 text-[13px] font-medium"
      >
        <button
          type="button"
          class="hover:bg-surface-root-hover-bg hover:text-fg-default transition-ink flex h-6.5 cursor-pointer items-center gap-1 rounded-md px-2"
          aria-expanded={domainsOpen}
          onclick={() => (domainsOpen = !domainsOpen)}
        >
          Domains
          {#if domainsOpen}
            <ChevronDownIcon class="size-3.5" />
          {:else}
            <ChevronRightIcon class="size-3.5" />
          {/if}
        </button>
        {#if addDomainHref}
          <Tooltip content="Add domain" placement="right">
            <!-- eslint-disable svelte/no-navigation-without-resolve -- href is supplied by the caller -->
            <a
              href={addDomainHref}
              class={ADD_DOMAIN_CLASS}
              aria-label="Add domain"
            >
              <PlusIcon class="size-4" />
            </a>
            <!-- eslint-enable svelte/no-navigation-without-resolve -->
          </Tooltip>
        {:else if onAddDomain}
          <Tooltip content="Add domain" placement="right">
            <button
              type="button"
              class={ADD_DOMAIN_CLASS}
              aria-label="Add domain"
              onclick={onAddDomain}
            >
              <PlusIcon class="size-4" />
            </button>
          </Tooltip>
        {/if}
      </div>

      {#if domainsOpen}
        {@render children()}
        {#if addDomainHref || onAddDomain}
          <SidebarMenuItem href={addDomainHref} onclick={onAddDomain}>
            <PlusIcon class="size-4 shrink-0" />
            <span class="truncate">Add domain</span>
          </SidebarMenuItem>
        {/if}
      {/if}
    </nav>
  </div>

  {@render footer()}
</div>
