<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    children: Snippet;
    action?: Snippet;
  };

  const { children, action }: Props = $props();
</script>

<div class="flex w-full items-center justify-between gap-4 px-4 py-4">
  <div class="min-w-0 flex-1 text-sm">
    {@render children()}
  </div>

  {#if action}
    <div class="-my-1.5 flex shrink-0 items-center gap-2">
      {@render action()}
    </div>
  {/if}
</div>
