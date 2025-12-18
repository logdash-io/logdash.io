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
    'flex w-full text-sm items-center gap-2 rounded-lg p-2 px-2.5',
    {
      'bg-base-100 text-base-content': isActive,
      'hover:bg-base-100/80 cursor-pointer': !isActive && !disabled,
      'opacity-50 cursor-not-allowed pointer-events-none': disabled,
    },
  ]);
</script>

{#if href}
  <a {href} class={baseClasses} {target}>
    {@render children()}
  </a>
{:else}
  <button {onclick} {disabled} class={baseClasses}>
    {@render children()}
  </button>
{/if}
