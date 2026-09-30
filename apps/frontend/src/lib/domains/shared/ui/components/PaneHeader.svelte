<script lang="ts" module>
  export const PANE_HEADER_ACTION_CLASS =
    'text-neutral-400 hover:text-fg-default hover:bg-surface-100 focus-visible:outline-brand transition-ink -mr-2 flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-2 text-xs focus-visible:outline-2 disabled:pointer-events-none';
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    title: string;
    children?: Snippet;
  };

  const { title, children }: Props = $props();
</script>

<div
  class="border-hairline flex h-12 shrink-0 items-center gap-3 border-b px-4"
>
  <h2 class="text-neutral-500 truncate text-xs font-normal">{title}</h2>

  {#if children}
    <div
      class="text-neutral-500 ml-auto flex shrink-0 items-center gap-2 text-xs"
    >
      {@render children()}
    </div>
  {/if}
</div>
