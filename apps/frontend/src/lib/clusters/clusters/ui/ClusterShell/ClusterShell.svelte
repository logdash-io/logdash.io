<script lang="ts">
  import SkyBackground from '$lib/shared/ui/components/SkyBackground.svelte';
  import type { Snippet } from 'svelte';
  import { cubicInOut } from 'svelte/easing';
  import { scale } from 'svelte/transition';
  import { backgroundState } from '../../application/background.state.svelte.js';
  import ClusterNav from './ClusterNav.svelte';

  type Props = {
    children: Snippet;
  };
  const { children }: Props = $props();
</script>

<div class="relative mx-auto flex h-full w-full flex-col gap-4 p-4 pt-0 lg:p-0">
  {#if backgroundState.isVisible}
    <div
      in:scale={{ duration: 100, easing: cubicInOut, start: 0.9 }}
      out:scale={{ duration: 100, easing: cubicInOut, start: 0.9 }}
      class="absolute left-0 top-0 h-full w-full overflow-hidden"
    >
      <SkyBackground />
    </div>
  {/if}
  <ClusterNav />

  <div class="xl:w-7xl mx-auto flex h-full max-h-full w-full">
    <div class="relative flex h-full w-full flex-col items-center">
      {@render children()}
    </div>
  </div>
</div>
