<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    children: Snippet;
  };

  const { children }: Props = $props();
</script>

<header
  class="flex min-h-12 shrink-0 flex-wrap items-center gap-x-3 gap-y-2 edge-b px-4 py-2"
>
  {@render children()}
</header>
