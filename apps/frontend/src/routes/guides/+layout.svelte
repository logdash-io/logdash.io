<script lang="ts">
  import GuidesLayout from '$lib/landing/guides/GuidesLayout.svelte';
  import type { Snippet } from 'svelte';

  type Props = {
    children: Snippet;
  };

  const { children }: Props = $props();
</script>

<div class="w-full">
  <GuidesLayout>
    {@render children()}
  </GuidesLayout>
</div>
