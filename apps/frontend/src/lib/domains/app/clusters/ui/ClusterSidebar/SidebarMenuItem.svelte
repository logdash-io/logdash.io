<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { ClassValue } from 'svelte/elements';

  interface Props {
    href?: string;
    onclick?: () => void;
    isActive?: boolean;
    disabled?: boolean;
    target?: string;
    class?: ClassValue;
    children: Snippet;
  }

  let {
    href,
    onclick,
    isActive = false,
    disabled = false,
    target,
    class: className,
    children,
  }: Props = $props();

  const baseClasses = $derived([
    'flex h-7 w-full min-w-0 items-center gap-2 rounded-lg px-2 text-[13px] select-none pointer-coarse:h-9',
    {
      'bg-surface-100 text-fg-default': isActive,
      'text-neutral-400 hover:bg-surface-hover hover:text-fg-default cursor-pointer [&>svg]:text-neutral-500 hover:[&>svg]:text-neutral-300':
        !isActive && !disabled,
      'text-neutral-600 cursor-not-allowed pointer-events-none': disabled,
    },
    className,
  ]);
  const ariaCurrent = $derived(isActive ? 'page' : undefined);
</script>

{#if href}
  <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- href is supplied by the caller -->
  <a {href} class={baseClasses} {target} aria-current={ariaCurrent}>
    {@render children()}
  </a>
{:else}
  <button {onclick} {disabled} class={baseClasses} aria-current={ariaCurrent}>
    {@render children()}
  </button>
{/if}
