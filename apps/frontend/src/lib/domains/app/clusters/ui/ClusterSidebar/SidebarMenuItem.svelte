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

  const isStatic = $derived(!href && !onclick);
  const baseClasses = $derived([
    'flex h-7 w-full min-w-0 items-center gap-2 rounded-lg px-2 text-[13px] select-none pointer-coarse:h-9',
    {
      'bg-surface-100 text-fg-default': isActive,
      'text-neutral-400 [&>svg]:text-neutral-500': !isActive && !disabled,
      'hover:bg-surface-hover hover:text-fg-default cursor-pointer hover:[&>svg]:text-neutral-300':
        !isActive && !disabled && !isStatic,
      'text-neutral-600 cursor-not-allowed': disabled,
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
