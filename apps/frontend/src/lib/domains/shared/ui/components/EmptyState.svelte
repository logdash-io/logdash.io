<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { ClassValue } from 'svelte/elements';

  type Props = {
    title: string;
    description?: string;
    class?: ClassValue;
    children?: Snippet;
  };

  const { title, description, class: className, children }: Props = $props();
</script>

<div class={['flex flex-col items-start gap-1', className]}>
  <span class="text-sm">{title}</span>

  {#if description}
    <span class="text-fg-muted text-sm">{description}</span>
  {/if}

  {#if children}
    <div class="mt-3 flex flex-col items-start">
      {@render children()}
    </div>
  {/if}
</div>
