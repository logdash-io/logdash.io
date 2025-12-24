<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    children: Snippet;
    class?: string;
    variant?: 'default' | 'danger';
  };

  const {
    children,
    class: className = '',
    variant = 'default',
  }: Props = $props();
</script>

<div
  class={[
    'overflow-hidden rounded-3xl',
    {
      'ld-card-base': variant === 'default',
      'border border-error/30 bg-error/10': variant === 'danger',
    },
    className,
  ]}
>
  {@render children()}
</div>
