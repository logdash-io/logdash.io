<script lang="ts">
  import ChevronDownIcon from '$lib/domains/shared/icons/ChevronDownIcon.svelte';
  import ChevronRightIcon from '$lib/domains/shared/icons/ChevronRightIcon.svelte';
  import type { Snippet } from 'svelte';
  import ProjectTile from './ProjectTile.svelte';

  type Props = {
    name: string;
    color?: string;
    expanded: boolean;
    online?: number;
    down?: number;
    ariaExpanded?: boolean;
    onclick?: () => void;
    children?: Snippet;
  };

  const {
    name,
    color,
    expanded,
    online = 0,
    down = 0,
    ariaExpanded,
    onclick,
    children,
  }: Props = $props();

  const ROW_CLASS =
    'text-fg-tertiary flex h-7.5 w-full shrink-0 items-center gap-1.5 rounded-lg px-2 text-sm font-medium select-none pointer-coarse:h-9';
</script>

{#if onclick}
  <button
    class={[
      ROW_CLASS,
      'group hover:bg-surface-root-hover-bg hover:text-fg-default cursor-pointer',
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
      class="text-fg-faint group-hover:text-fg-tertiary size-3.5 shrink-0"
    />
  {:else}
    <ChevronRightIcon
      class="text-fg-faint group-hover:text-fg-tertiary size-3.5 shrink-0"
    />
  {/if}
  {#if down}
    <span
      class="text-error ml-auto flex shrink-0 items-center gap-1.5 pl-1 text-[13px] tabular-nums"
      title="{down} {down === 1 ? 'service' : 'services'} down"
    >
      <span class="bg-error size-1.5 rounded-full"></span>
      {down} down
    </span>
  {:else if online}
    <span
      class="text-fg-tertiary ml-auto flex shrink-0 items-center gap-1.5 pl-1 text-[13px] tabular-nums"
      title="{online} {online === 1 ? 'visitor' : 'visitors'} online now"
    >
      <span class="bg-success size-1.5 rounded-full"></span>
      {online}
    </span>
  {/if}
{/snippet}
