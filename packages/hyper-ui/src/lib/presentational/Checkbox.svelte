<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements";

  type Props = Omit<HTMLInputAttributes, "type" | "size"> & {
    checked?: boolean;
    size?: "xs" | "sm";
    variant?: "default" | "primary";
  };

  let {
    checked = $bindable(false),
    size = "sm",
    variant = "default",
    class: className,
    ...rest
  }: Props = $props();
</script>

<input
  {...rest}
  type="checkbox"
  bind:checked
  class={["ld-checkbox", className]}
  data-size={size}
  data-variant={variant}
/>

<style>
  @layer theme, base, components;

  @layer components {
    .ld-checkbox {
      --checkbox-size: 1.25rem;
      position: relative;
      display: inline-block;
      flex-shrink: 0;
      width: var(--checkbox-size);
      height: var(--checkbox-size);
      padding: 0.1875rem;
      border: 1px solid var(--border-strong);
      border-radius: 0.375rem;
      color: var(--fg-default);
      vertical-align: middle;
      cursor: pointer;
      appearance: none;
      transition: box-shadow 0.2s;
    }

    .ld-checkbox[data-size="xs"] {
      --checkbox-size: 1rem;
      padding: 0.125rem;
      border-radius: 0.25rem;
    }

    .ld-checkbox[data-variant="primary"] {
      border-color: var(--brand);
      color: var(--surface-root);
    }

    .ld-checkbox[data-variant="primary"]:checked {
      background-color: var(--brand);
    }

    .ld-checkbox::before {
      content: "";
      display: block;
      width: 100%;
      height: 100%;
      rotate: 45deg;
      background-color: currentColor;
      opacity: 0;
      clip-path: polygon(
        20% 100%,
        20% 80%,
        50% 80%,
        50% 80%,
        70% 80%,
        70% 100%
      );
      transition:
        clip-path 0.3s,
        opacity 0.1s,
        rotate 0.3s,
        translate 0.3s;
      transition-delay: 0.1s;
    }

    .ld-checkbox:checked::before {
      opacity: 1;
      clip-path: polygon(20% 100%, 20% 80%, 50% 80%, 50% 0%, 70% 0%, 70% 100%);
    }

    .ld-checkbox:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }

    .ld-checkbox:disabled {
      cursor: not-allowed;
      opacity: 0.2;
    }

    @media (forced-colors: active) {
      .ld-checkbox:checked::before {
        content: "✔︎";
        font-size: 1rem;
        line-height: 0.75;
        rotate: 0deg;
        background-color: transparent;
        clip-path: none;
      }
    }
  }
</style>
