<script lang="ts">
  import GuidesLayout from '$lib/landing/guides/GuidesLayout.svelte';
  import type { Snippet } from 'svelte';

  type Props = {
    children: Snippet;
  };

  const { children }: Props = $props();
</script>

<!--
  Same shell as /guides, minus the server load: none of the docs pages show
  plan limits, so there are no tables to fetch and every route here prerenders.
-->
<div class="w-full">
  <GuidesLayout>
    {@render children()}
  </GuidesLayout>
</div>
