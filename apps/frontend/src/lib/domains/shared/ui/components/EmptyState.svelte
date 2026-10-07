<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { ClassValue } from 'svelte/elements';

  type Props = {
    title: string;
    description?: string;
    centered?: boolean;
    class?: ClassValue;
    children?: Snippet;
  };

  const {
    title,
    description,
    centered = false,
    class: className,
    children,
  }: Props = $props();
</script>

<div
  class={[
    'flex flex-col',
    centered
      ? 'items-center justify-center gap-2 px-6 py-10 text-center'
      : 'items-start gap-1',
    className,
  ]}
>
  <span class={centered ? 'font-medium' : 'text-sm'}>{title}</span>

  {#if description}
    <span
      class={[
        'text-sm',
        centered ? 'text-fg-tertiary max-w-sm' : 'text-fg-muted',
      ]}
    >
      {description}
    </span>
  {/if}

  {#if children}
    <div
      class={[
        'flex flex-col',
        centered ? 'mt-2 items-center' : 'mt-3 items-start',
      ]}
    >
      {@render children()}
    </div>
  {/if}
</div>
