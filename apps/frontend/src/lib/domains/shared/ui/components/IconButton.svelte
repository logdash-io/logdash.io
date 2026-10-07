<script lang="ts">
  import { Tooltip } from '@logdash/hyper-ui/presentational';
  import type { Snippet } from 'svelte';
  import type { ClassValue } from 'svelte/elements';

  type Props = {
    label: string;
    tooltip?: string;
    href?: string;
    danger?: boolean;
    raised?: boolean;
    well?: boolean;
    disabled?: boolean;
    class?: ClassValue;
    onclick?: () => void;
    children: Snippet;
    [key: `data-${string}`]: string;
  };

  const {
    label,
    tooltip,
    href,
    danger = false,
    raised = false,
    well = false,
    disabled = false,
    class: className,
    onclick,
    children,
    ...rest
  }: Props = $props();

  const buttonClass = $derived([
    'text-fg-muted focus-visible:outline-brand transition-ink relative flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md focus-visible:outline-2 disabled:pointer-events-none disabled:text-fg-disabled',
    raised
      ? 'hover:bg-surface-150-hover-bg'
      : well
        ? 'hover:bg-surface-25-hover-bg'
        : 'hover:bg-surface-100-hover-bg',
    danger ? 'hover:text-error' : 'hover:text-fg-default',
    className,
  ]);
</script>

<Tooltip content={tooltip ?? label} placement="top">
  {#if href}
    <!-- eslint-disable svelte/no-navigation-without-resolve -- icon links point outside the app -->
    <a
      {...rest}
      {href}
      target="_blank"
      rel="noopener noreferrer"
      class={buttonClass}
      aria-label={label}
    >
      {@render children()}
    </a>
    <!-- eslint-enable svelte/no-navigation-without-resolve -->
  {:else}
    <button
      {...rest}
      type="button"
      class={buttonClass}
      aria-label={label}
      {disabled}
      {onclick}
    >
      {@render children()}
    </button>
  {/if}
</Tooltip>
