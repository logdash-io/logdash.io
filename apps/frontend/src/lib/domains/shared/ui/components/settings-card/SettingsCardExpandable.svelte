<script lang="ts">
  import type { Snippet } from 'svelte';
  import ChevronDownIcon from '$lib/domains/shared/icons/ChevronDownIcon.svelte';
  import { slide } from 'svelte/transition';

  type Props = {
    title: string;
    description?: string;
    icon?: any;
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

  let expanded = $state(defaultExpanded);

  function onToggle(): void {
    expanded = !expanded;
  }
</script>

<div class="overflow-hidden">
  <button
    type="button"
    class="flex w-full cursor-pointer items-center justify-between p-4 transition-colors hover:bg-base-100/50"
    onclick={onToggle}
  >
    <div class="flex items-center gap-4">
      {#if Icon}
        <div class="rounded-lg bg-base-100 p-2.5">
          <Icon class="size-5 text-base-content/70" />
        </div>
      {/if}
      <div class="text-left">
        <p class="font-medium">{title}</p>
        {#if description}
          <p class="text-base-content/60 text-sm">{description}</p>
        {/if}
      </div>
    </div>

    <ChevronDownIcon
      class={[
        'size-5 text-base-content/60 transition-transform duration-200',
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
