<script lang="ts">
  import { untrack } from 'svelte';
  import type { Component, Snippet } from 'svelte';
  import type { ClassValue } from 'svelte/elements';
  import ChevronDownIcon from '$lib/domains/shared/icons/ChevronDownIcon.svelte';
  import { slide } from 'svelte/transition';

  type Props = {
    title: string;
    description?: string;
    icon?: Component<{ class?: ClassValue }>;
    children: Snippet;
    defaultExpanded?: boolean;
  };

  const {
    title,
    description,
    icon: Icon,
    children,
    defaultExpanded = false,
  }: Props = $props();

  let expanded = $state(untrack(() => defaultExpanded));

  function onToggle(): void {
    expanded = !expanded;
  }
</script>

<div class="overflow-hidden">
  <button
    type="button"
    class="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-3.5 hover:bg-neutral-800"
    onclick={onToggle}
  >
    <div class="flex items-center gap-3.5">
      {#if Icon}
        <Icon class="text-neutral-500 size-4 shrink-0" />
      {/if}
      <div class="text-left text-sm">
        <p class="font-medium">{title}</p>
        {#if description}
          <p class="text-neutral-500">{description}</p>
        {/if}
      </div>
    </div>

    <ChevronDownIcon
      class={[
        'text-neutral-500 size-4 shrink-0 transition-transform duration-200',
        { 'rotate-180': expanded },
      ]}
    />
  </button>

  {#if expanded}
    <div transition:slide={{ duration: 200 }}>
      {@render children()}
    </div>
  {/if}
</div>
