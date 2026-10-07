<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { ClassValue } from 'svelte/elements';

  type Props = {
    label: string;
    title?: string;
    header?: Snippet;
    actions?: Snippet;
    class?: ClassValue;
    children: Snippet;
  };

  const {
    label,
    title,
    header,
    actions,
    class: className,
    children,
  }: Props = $props();
</script>

<section
  class={[
    'bg-surface-25-bg flex min-w-0 flex-col gap-2 rounded-2xl p-2',
    className,
  ]}
  aria-label={label}
>
  {#if header || title || actions}
    <header class="flex h-7 shrink-0 items-center justify-between gap-3">
      {#if header}
        {@render header()}
      {:else}
        <h2 class="truncate px-3 text-[13px] font-medium">{title}</h2>
      {/if}
      {#if actions}
        <div class="flex shrink-0 items-center gap-1">
          {@render actions()}
        </div>
      {/if}
    </header>
  {/if}

  {@render children()}
</section>
