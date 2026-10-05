<script lang="ts" module>
  export const PANE_HEADER_ACTION_CLASS =
    'text-fg-tertiary hover:text-fg-default hover:bg-surface-50-hover-bg focus-visible:outline-brand transition-ink -mr-2 flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-2 text-[13px] focus-visible:outline-2 disabled:pointer-events-none';
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    title: string;
    children?: Snippet;
  };

  const { title, children }: Props = $props();
</script>

<div class="flex h-12 shrink-0 items-center gap-3 edge-b px-4">
  <h2 class="text-fg-muted truncate text-xs font-medium">{title}</h2>

  {#if children}
    <div class="text-fg-muted ml-auto flex shrink-0 items-center gap-2 text-xs">
      {@render children()}
    </div>
  {/if}
</div>
