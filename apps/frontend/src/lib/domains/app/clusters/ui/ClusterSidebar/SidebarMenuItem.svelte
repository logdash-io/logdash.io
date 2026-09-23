<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    href?: string;
    onclick?: () => void;
    isActive?: boolean;
    disabled?: boolean;
    target?: string;
    children: Snippet;
  }

  let {
    href,
    onclick,
    isActive = false,
    disabled = false,
    target,
    children,
  }: Props = $props();

  const baseClasses = $derived([
    'flex h-8 w-full items-center gap-2 rounded-lg px-2 text-sm',
    {
      'bg-surface-root-selected text-base-content': isActive,
      'text-neutral-400 hover:bg-surface-root-hover hover:text-base-content cursor-pointer':
        !isActive && !disabled,
      'text-neutral-600 cursor-not-allowed pointer-events-none': disabled,
    },
  ]);
</script>

{#if href}
  <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- href is supplied by the caller -->
  <a {href} class={baseClasses} {target}>
    {@render children()}
  </a>
{:else}
  <button {onclick} {disabled} class={baseClasses}>
    {@render children()}
  </button>
{/if}
