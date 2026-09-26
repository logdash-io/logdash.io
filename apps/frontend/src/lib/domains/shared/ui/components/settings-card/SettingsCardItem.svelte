<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  import type { ClassValue } from 'svelte/elements';

  type Props = {
    icon?: Component<{ class?: ClassValue }>;
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
    'flex w-full items-center justify-between gap-4 px-5 py-3.5',
    {
      'border-hairline border-b last:border-b-0': showBorder,
      'cursor-pointer hover:bg-neutral-800': isClickable,
    },
  ]}
  {onclick}
>
  <div class="flex min-w-0 items-center gap-3.5">
    {#if Icon}
      <Icon
        class={[
          'size-4 shrink-0',
          iconVariant === 'danger' ? 'text-error' : 'text-neutral-500',
        ]}
      />
    {/if}
    <div class="min-w-0 text-left text-sm">
      {@render children()}
    </div>
  </div>

  {#if action}
    <div class="flex shrink-0 items-center gap-2">
      {@render action()}
    </div>
  {/if}
</svelte:element>
