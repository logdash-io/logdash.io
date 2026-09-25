<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLInputAttributes } from "svelte/elements";

  type Props = Omit<HTMLInputAttributes, "size" | "value"> & {
    value?: string | number | null;
    size?: "sm" | "md";
    variant?: "filled" | "outline";
    error?: boolean;
    leading?: Snippet;
  };

  let {
    value = $bindable(),
    size = "md",
    variant = "filled",
    error = false,
    leading,
    class: className,
    ...rest
  }: Props = $props();
</script>

{#if leading}
  <label
    class={["ld-text-input", className]}
    data-size={size}
    data-variant={variant}
    data-error={error || undefined}
  >
    {@render leading()}
    <input {...rest} bind:value aria-invalid={error || undefined} />
  </label>
{:else}
  <input
    {...rest}
    bind:value
    class={["ld-text-input", className]}
    data-size={size}
    data-variant={variant}
    data-error={error || undefined}
    aria-invalid={error || undefined}
  />
{/if}

<style>
  @layer theme, base, components;

  @layer components {
    .ld-text-input {
      position: relative;
      display: inline-flex;
      flex-shrink: 1;
      align-items: center;
      gap: 0.5rem;
      width: clamp(3rem, 20rem, 100%);
      height: 2.5rem;
      padding-inline: 0.75rem;
      border: 1px solid var(--fg-faint);
      border-radius: 0.75rem;
      background-color: var(--surface-100);
      font-size: 0.875rem;
      white-space: nowrap;
      vertical-align: middle;
      cursor: text;
      appearance: none;
      touch-action: manipulation;
    }

    .ld-text-input[data-size="sm"] {
      height: 2rem;
      font-size: 0.75rem;
    }

    .ld-text-input[data-variant="outline"] {
      width: 100%;
      height: 100%;
      padding: 0.375rem 0.75rem;
      border-color: var(--border-strong);
      background-color: transparent;
      transition-property: color, border-color;
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      transition-duration: 250ms;
    }

    .ld-text-input[data-variant="outline"]:hover {
      border-color: var(--fg-faint);
    }

    .ld-text-input[data-variant="outline"]::selection {
      background-color: var(--surface-150);
    }

    .ld-text-input > input {
      display: inline-flex;
      width: 100%;
      height: 100%;
      border: none;
      background-color: transparent;
      appearance: none;
      outline: none;
    }

    .ld-text-input:focus,
    .ld-text-input:focus-within {
      outline: none;
      border-color: var(--brand);
      box-shadow: var(--focus-ring);
    }

    .ld-text-input[data-error] {
      border-color: var(--error);
    }

    .ld-text-input[data-error]:focus,
    .ld-text-input[data-error]:focus-within {
      box-shadow: var(--focus-ring-error);
    }

    .ld-text-input:disabled,
    .ld-text-input:has(> input:disabled) {
      cursor: not-allowed;
      border-color: var(--surface-elevated);
      background-color: var(--surface-elevated);
      color: var(--fg-muted);
    }

    .ld-text-input[data-variant="outline"]:disabled {
      border-color: var(--border-strong);
      background-color: transparent;
    }

    .ld-text-input:has(> input:disabled) > input {
      cursor: not-allowed;
    }

    .ld-text-input::-webkit-calendar-picker-indicator {
      position: absolute;
      inset-inline-end: 0.75em;
    }

    @media (pointer: coarse) {
      @supports (-webkit-touch-callout: none) {
        .ld-text-input:focus,
        .ld-text-input:focus-within {
          font-size: 1rem;
        }
      }
    }
  }
</style>
