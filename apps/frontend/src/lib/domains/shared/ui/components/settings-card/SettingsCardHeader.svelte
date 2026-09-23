<script lang="ts">
  import type { Component } from 'svelte';
  import type { ClassValue } from 'svelte/elements';

  type Props = {
    title: string;
    description?: string;
    icon?: Component<{ class?: ClassValue }>;
    variant?: 'default' | 'danger';
  };

  const {
    title,
    description,
    icon: Icon,
    variant = 'default',
  }: Props = $props();
</script>

<div class="border-hairline border-b px-5 py-4">
  <div class="flex items-center gap-2">
    {#if Icon}
      <Icon
        class={[
          'size-4 shrink-0',
          variant === 'danger' ? 'text-error' : 'text-neutral-500',
        ]}
      />
    {/if}
    <h2
      class={['text-base font-medium', { 'text-error': variant === 'danger' }]}
    >
      {title}
    </h2>
  </div>
  {#if description}
    <p class="text-neutral-500 mt-0.5 text-sm">
      {description}
    </p>
  {/if}
</div>
