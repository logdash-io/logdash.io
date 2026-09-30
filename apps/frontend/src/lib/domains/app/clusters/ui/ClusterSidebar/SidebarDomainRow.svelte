<script lang="ts">
  import ChevronDownIcon from '$lib/domains/shared/icons/ChevronDownIcon.svelte';
  import ChevronRightIcon from '$lib/domains/shared/icons/ChevronRightIcon.svelte';
  import type { Snippet } from 'svelte';
  import ProjectTile from './ProjectTile.svelte';

  type Props = {
    name: string;
    color?: string;
    expanded: boolean;
    ariaExpanded?: boolean;
    onclick?: () => void;
    children?: Snippet;
  };

  const { name, color, expanded, ariaExpanded, onclick, children }: Props =
    $props();

  const ROW_CLASS =
    'text-neutral-400 flex h-7 w-full shrink-0 items-center gap-2 rounded-lg px-2 text-[13px] select-none pointer-coarse:h-9';
</script>

{#if onclick}
  <button
    class={[
      ROW_CLASS,
      'group hover:bg-surface-hover hover:text-fg-default cursor-pointer',
    ]}
    aria-expanded={ariaExpanded}
    {onclick}
  >
    {@render content()}
  </button>
{:else}
  <div class={ROW_CLASS}>
    {@render content()}
  </div>
{/if}

{#snippet content()}
  <ProjectTile {name} {color} />
  {#if children}
    {@render children()}
  {:else}
    <span class="truncate">{name}</span>
  {/if}
  {#if expanded}
    <ChevronDownIcon
      class="text-neutral-600 group-hover:text-neutral-400 size-3 shrink-0"
    />
  {:else}
    <ChevronRightIcon
      class="text-neutral-600 group-hover:text-neutral-400 size-3 shrink-0"
    />
  {/if}
{/snippet}
