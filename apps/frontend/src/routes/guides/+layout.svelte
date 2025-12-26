<script lang="ts">
  import AnimatedView from '$lib/domains/shared/ui/AnimatedView.svelte';
  import GuidesLayout from '$lib/landing/guides/GuidesLayout.svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();
</script>

<AnimatedView class="w-full">
  <GuidesLayout>
    {@render children()}
  </GuidesLayout>
</AnimatedView>
