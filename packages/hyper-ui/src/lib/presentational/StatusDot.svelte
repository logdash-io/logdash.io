<script lang="ts">
  import type { ClassValue, HTMLAttributes } from "svelte/elements";

  type Props = Omit<HTMLAttributes<HTMLSpanElement>, "class"> & {
    variant: "success" | "error" | "warning";
    class?: ClassValue;
  };

  let { variant, class: className, ...rest }: Props = $props();
</script>

<span
  aria-hidden="true"
  {...rest}
  class={["ld-status-dot", className]}
  data-variant={variant}
></span>

<style>
  @layer theme, base, components;

  @layer components {
    .ld-status-dot {
      display: inline-block;
      width: 0.5rem;
      height: 0.5rem;
      aspect-ratio: 1;
      border-radius: calc(infinity * 1px);
      vertical-align: middle;
    }

    .ld-status-dot[data-variant="success"] {
      background-color: var(--success);
    }

    .ld-status-dot[data-variant="error"] {
      background-color: var(--error);
    }

    .ld-status-dot[data-variant="warning"] {
      background-color: var(--warning);
    }
  }
</style>
