<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { ClassValue } from 'svelte/elements';

  type Props = {
    class?: ClassValue;
    header?: Snippet;
    children: Snippet;
  };

  const { class: className, header, children }: Props = $props();
</script>

<!-- A stage is an illustration, not copy: snippets and markdown twins skip it. -->
<div
  data-nosnippet
  class={[
    'ring-surface-100-border bg-surface-100-bg absolute flex flex-col overflow-hidden shadow-[0_32px_64px_-24px_rgba(0,0,0,0.7)] ring-1',
    className,
  ]}
>
  {#if header}
    <div
      class="border-surface-100-border flex h-11 shrink-0 items-center gap-3 border-b px-4 text-sm"
    >
      {@render header()}
    </div>
  {/if}

  <div class="flex min-h-0 flex-1 flex-col">
    {@render children()}
  </div>
</div>
