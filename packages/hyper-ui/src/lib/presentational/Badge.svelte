<script lang="ts">
  import type { Snippet } from "svelte";
  import type { ClassValue, HTMLAttributes } from "svelte/elements";

  type Props = Omit<HTMLAttributes<HTMLSpanElement>, "class" | "children"> & {
    variant?: "neutral" | "inverse" | "success" | "error" | "warning";
    size?: "xs" | "sm" | "md" | "lg";
    class?: ClassValue;
    children: Snippet;
  };

  let {
    variant = "neutral",
    size = "md",
    class: className,
    children,
    ...rest
  }: Props = $props();
</script>

<span
  {...rest}
  class={["ld-badge", className]}
  data-variant={variant}
  data-size={size}
>
  {@render children()}
</span>

<style>
  @layer theme, base, components;

  @layer components {
    .ld-badge {
      --badge-tone: var(--fg-default);
      --badge-size: 1.5rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      width: fit-content;
      height: var(--badge-size);
      padding-inline: calc(var(--badge-size) / 2 - 1px);
      border: 1px solid
        color-mix(in oklab, var(--badge-tone) 10%, var(--surface-100));
      border-radius: calc(infinity * 1px);
      background-color: color-mix(
        in oklab,
        var(--badge-tone) 8%,
        var(--surface-100)
      );
      color: var(--badge-tone);
      font-size: 0.875rem;
      vertical-align: middle;
    }

    .ld-badge[data-size="xs"] {
      --badge-size: 1rem;
      font-size: 0.625rem;
    }

    .ld-badge[data-size="sm"] {
      --badge-size: 1.25rem;
      font-size: 0.75rem;
    }

    .ld-badge[data-size="lg"] {
      --badge-size: 1.75rem;
      font-size: 1rem;
    }

    .ld-badge[data-variant="success"] {
      --badge-tone: var(--success);
    }

    .ld-badge[data-variant="error"] {
      --badge-tone: var(--error);
    }

    .ld-badge[data-variant="warning"] {
      --badge-tone: var(--warning);
    }

    .ld-badge[data-variant="inverse"] {
      border-color: var(--surface-inverse);
      background-color: var(--surface-inverse);
      color: var(--surface-root);
    }
  }
</style>
