<script lang="ts">
  import DocsLayout from '$lib/landing/guides/DocsLayout.svelte';
  import type { Snippet } from 'svelte';

  type Props = {
    children: Snippet;
  };

  const { children }: Props = $props();
</script>

<div class="w-full">
  <DocsLayout>
    {@render children()}
  </DocsLayout>
</div>
