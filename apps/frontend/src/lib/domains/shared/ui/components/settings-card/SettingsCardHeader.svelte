<script lang="ts">
  import type { Component } from 'svelte';
  import type { ClassValue } from 'svelte/elements';

  type Props = {
    title: string;
    description?: string;
    variant?: 'default' | 'danger';
    icon?: Component<{ class?: ClassValue }>;
  };

  const {
    title,
    description,
    variant = 'default',
    icon: Icon,
  }: Props = $props();
</script>

<div class="flex flex-col gap-1">
  <h2
    id={title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
    class={[
      'scroll-mt-10 text-[15px] font-medium',
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
