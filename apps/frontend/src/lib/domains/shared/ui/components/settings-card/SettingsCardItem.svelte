<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    children: Snippet;
    action?: Snippet;
  };

  const { children, action }: Props = $props();
</script>

<div
  class="flex min-h-12 w-full items-center justify-between gap-4 px-3 py-2.5"
>
  <div class="min-w-0 flex-1 text-[13px]">
    {@render children()}
  </div>

  {#if action}
    <div class="-my-1.5 flex shrink-0 items-center gap-2">
      {@render action()}
    </div>
  {/if}
</div>
