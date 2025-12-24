<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    icon?: any;
    iconVariant?: 'default' | 'danger';
    children: Snippet;
    action?: Snippet;
    showBorder?: boolean;
    onclick?: () => void;
  };

  const {
    icon: Icon,
    iconVariant = 'default',
    children,
    action,
    showBorder = true,
    onclick,
  }: Props = $props();

  const isClickable = $derived(!!onclick);
</script>

<svelte:element
  this={isClickable ? 'button' : 'div'}
  type={isClickable ? 'button' : undefined}
  class={[
    'flex items-center justify-between p-4 w-full',
    {
      'border-b border-base-100/50': showBorder,
      'cursor-pointer transition-colors hover:bg-base-100/50': isClickable,
    },
  ]}
  {onclick}
>
  <div class="flex items-center gap-4">
    {#if Icon}
      <div
        class={[
          'rounded-lg p-2.5 aspect-square',
          {
            'bg-base-100': iconVariant === 'default',
            'bg-error/10': iconVariant === 'danger',
          },
        ]}
      >
        <Icon
          class={[
            'size-5',
            {
              'text-base-content/70': iconVariant === 'default',
              'text-error': iconVariant === 'danger',
            },
          ]}
        />
      </div>
    {/if}
    <div class="text-left">
      {@render children()}
    </div>
  </div>

  {#if action}
    <div class="flex items-center gap-2">
      {@render action()}
    </div>
  {/if}
</svelte:element>
