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

  const rowClass = $derived([
    'flex w-full items-center justify-between gap-4 px-4 py-4 text-left',
    { 'border-hairline border-b last:border-b-0': showBorder },
  ]);
</script>

{#if onclick}
  <button
    type="button"
    class={[
      rowClass,
      'hover:bg-surface-100 focus-visible:outline-brand cursor-pointer focus-visible:-outline-offset-2 focus-visible:outline-2',
    ]}
    {onclick}
  >
    {@render content()}
  </button>
{:else}
  <div class={rowClass}>
    {@render content()}
  </div>
{/if}

{#snippet content()}
  <div class="flex min-w-0 flex-1 items-center gap-3">
    {#if Icon}
      <Icon
        class={[
          'size-4 shrink-0',
          iconVariant === 'danger' ? 'text-error' : 'text-neutral-500',
        ]}
      />
    {/if}
    <div class="min-w-0 flex-1 text-sm">
      {@render children()}
    </div>
  </div>

  {#if action}
    <div class="-my-1.5 flex shrink-0 items-center gap-2">
      {@render action()}
    </div>
  {/if}
{/snippet}
