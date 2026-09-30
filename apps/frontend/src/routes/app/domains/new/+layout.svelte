<script lang="ts">
  import { onDestroy, onMount, type Snippet } from 'svelte';
  import { wizardState } from '$lib/domains/app/clusters/application/wizard.state.svelte.js';

  type Props = {
    children: Snippet;
  };
  const { children }: Props = $props();

  onMount(() => {
    wizardState.initialize();
  });

  onDestroy(() => {
    wizardState.deactivate();
  });
</script>

{@render children()}
