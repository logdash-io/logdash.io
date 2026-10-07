<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  import type { ClassValue } from 'svelte/elements';

  type Props = {
    title: string;
    description?: string;
    variant?: 'default' | 'danger';
    icon?: Component<{ class?: ClassValue }>;
    actions?: Snippet;
    children: Snippet;
  };

  const {
    title,
    description,
    variant = 'default',
    icon: Icon,
    actions,
    children,
  }: Props = $props();
</script>

<section class="bg-surface-25-bg flex min-w-0 flex-col gap-1 rounded-2xl p-2">
  <div class="flex min-h-7 items-start justify-between gap-3 px-3 pt-1.5">
    <div class="flex min-w-0 flex-col gap-0.5">
      <h2
        id={title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
        class={[
          'scroll-mt-4 text-[13px] font-medium',
          { 'text-error': variant === 'danger' },
        ]}
      >
        {#if Icon}
          <span hidden data-toc-icon><Icon class="size-3.5 shrink-0" /></span>
        {/if}
        {title}
      </h2>
      {#if description}
        <p class="text-fg-muted text-[13px]">{description}</p>
      {/if}
    </div>
    {#if actions}
      <div class="-mt-0.5 flex shrink-0 items-center gap-1">
        {@render actions()}
      </div>
    {/if}
  </div>

  <div class="edge-between flex min-w-0 flex-col">
    {@render children()}
  </div>
</section>
