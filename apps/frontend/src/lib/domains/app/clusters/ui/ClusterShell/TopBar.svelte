<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    children: Snippet;
  };

  const { children }: Props = $props();
</script>

<header
  class="border-hairline flex h-12 shrink-0 items-center gap-3 border-b px-4"
>
  {@render children()}
</header>
