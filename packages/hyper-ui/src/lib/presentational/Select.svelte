<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLSelectAttributes } from "svelte/elements";

  type Props = Omit<HTMLSelectAttributes, "size" | "value"> & {
    value?: string | number | null;
    size?: "sm" | "md";
    children: Snippet;
  };

  let {
    value = $bindable(),
    size = "md",
    class: className,
    children,
    ...rest
  }: Props = $props();
</script>

<select {...rest} bind:value class={["ld-select", className]} data-size={size}>
  {@render children()}
</select>

<style>
  @layer theme, base, components;

  @layer components {
    .ld-select {
      position: relative;
      display: inline-flex;
      flex-shrink: 1;
      align-items: center;
      gap: 0.375rem;
      width: clamp(3rem, 20rem, 100%);
      height: 2.5rem;
      padding-inline: 0.75rem 1.75rem;
      border: 1px solid var(--fg-faint);
      border-radius: 0.75rem;
      background-color: var(--surface-100);
      background-image:
        linear-gradient(45deg, #0000 50%, currentColor 50%),
        linear-gradient(135deg, currentColor 50%, #0000 50%);
      background-position:
        calc(100% - 20px) calc(1px + 50%),
        calc(100% - 16.1px) calc(1px + 50%);
      background-size:
        4px 4px,
        4px 4px;
      background-repeat: no-repeat;
      font-size: 0.875rem;
      white-space: nowrap;
      text-overflow: ellipsis;
      vertical-align: middle;
      overflow: hidden;
      appearance: none;
      touch-action: manipulation;
    }

    .ld-select[data-size="sm"] {
      height: 2rem;
      font-size: 0.75rem;
    }

    .ld-select:focus {
      outline: none;
      border-color: var(--brand);
      box-shadow: var(--focus-ring);
    }

    .ld-select:disabled {
      cursor: not-allowed;
      border-color: var(--surface-elevated);
      background-color: var(--surface-elevated);
      color: var(--fg-muted);
    }

    @supports (appearance: base-select) {
      .ld-select,
      .ld-select::picker(select) {
        appearance: base-select;
      }
    }

    .ld-select::picker(select) {
      max-height: min(24rem, 70dvh);
      margin-block: 0.5rem;
      margin-inline: 0.5rem;
      padding: 0.5rem;
      border: 1px solid var(--surface-elevated);
      border-radius: 0.75rem;
      background-color: inherit;
      color: inherit;
      translate: -0.5rem 0;
    }

    .ld-select::picker-icon {
      display: none;
    }

    .ld-select :global(option) {
      padding: 0.375rem 0.75rem;
      border-radius: 0.75rem;
      white-space: normal;
      transition: color 0.2s cubic-bezier(0, 0, 0.2, 1);
    }

    .ld-select[data-size="sm"] :global(option) {
      padding: 0.25rem 0.625rem;
    }

    .ld-select :global(option:not(:disabled):is(:hover, :focus-visible)) {
      cursor: pointer;
      outline: none;
      background-color: var(--surface-150);
    }

    .ld-select :global(option:not(:disabled):active) {
      background-color: var(--surface-100);
      color: var(--fg-default);
    }
  }
</style>
