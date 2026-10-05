<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { ClassValue } from 'svelte/elements';

  interface Props {
    href?: string;
    onclick?: () => void;
    isActive?: boolean;
    nested?: boolean;
    disabled?: boolean;
    target?: string;
    class?: ClassValue;
    children: Snippet;
  }

  let {
    href,
    onclick,
    isActive = false,
    nested = false,
    disabled = false,
    target,
    class: className,
    children,
  }: Props = $props();

  const isStatic = $derived(!href && !onclick);
  const baseClasses = $derived([
    'flex h-7.5 min-w-0 items-center gap-1.5 rounded-lg text-sm font-medium select-none pointer-coarse:h-9',
    {
      'w-full px-2': !nested,
      'ml-5.5 w-[calc(100%-1.375rem)] pr-2 pl-1.5': nested,
      'bg-surface-root-selected-bg text-fg-default': isActive,
      'text-fg-tertiary': !isActive && !disabled,
      'hover:bg-surface-root-hover-bg hover:text-fg-default cursor-pointer':
        !isActive && !disabled && !isStatic,
      'text-fg-faint cursor-not-allowed': disabled,
    },
    className,
  ]);
  const ariaCurrent = $derived(isActive ? 'page' : undefined);
</script>

{#if disabled}
  <div class={baseClasses} aria-disabled="true" tabindex="-1">
    {@render children()}
  </div>
{:else if href}
  <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- href is supplied by the caller -->
  <a {href} class={baseClasses} {target} aria-current={ariaCurrent}>
    {@render children()}
  </a>
{:else if isStatic}
  <div class={baseClasses}>
    {@render children()}
  </div>
{:else}
  <button {onclick} class={baseClasses} aria-current={ariaCurrent}>
    {@render children()}
  </button>
{/if}
