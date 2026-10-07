<script module lang="ts">
  import type { Component } from 'svelte';
  import type { ClassValue } from 'svelte/elements';

  export type ServiceTab = {
    id: string;
    label: string;
    icon: Component<{ class?: ClassValue }>;
    active: boolean;
    href?: string;
  };
</script>

<script lang="ts">
  import {
    TOOLBAR_GROUP,
    TOOLBAR_GROUP_OPTION,
  } from '$lib/domains/shared/ui/components/toolbar.js';

  type Props = {
    tabs: ServiceTab[];
  };

  const { tabs }: Props = $props();

  const tabClass = (tab: ServiceTab): ClassValue => [
    TOOLBAR_GROUP_OPTION,
    'gap-1.5',
    tab.active
      ? 'bg-surface-150-bg text-fg-default'
      : 'text-fg-tertiary hover:text-fg-default',
  ];
</script>

<nav class={TOOLBAR_GROUP} aria-label="Service">
  {#each tabs as tab (tab.id)}
    {#if tab.href}
      <!-- eslint-disable svelte/no-navigation-without-resolve -- href is supplied by the caller -->
      <a
        href={tab.href}
        class={tabClass(tab)}
        aria-label={tab.label}
        aria-current={tab.active ? 'page' : undefined}
      >
        {@render content(tab)}
      </a>
      <!-- eslint-enable svelte/no-navigation-without-resolve -->
    {:else}
      <span class={tabClass(tab)}>
        {@render content(tab)}
      </span>
    {/if}
  {/each}
</nav>

{#snippet content(tab: ServiceTab)}
  <tab.icon class="size-3.5 shrink-0 sm:hidden" />
  <span class={[{ 'max-sm:hidden': !tab.active }]}>{tab.label}</span>
{/snippet}
