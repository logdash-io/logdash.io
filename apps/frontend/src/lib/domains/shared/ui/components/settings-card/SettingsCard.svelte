<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    children: Snippet;
    class?: string;
  };

  const { children, class: className = '' }: Props = $props();
</script>

<div class={['ld-card-base overflow-hidden rounded-xl', className]}>
  {@render children()}
</div>
