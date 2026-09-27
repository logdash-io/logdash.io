<script lang="ts">
  import type { Snippet } from "svelte";
  import type { ClassValue, HTMLAttributes } from "svelte/elements";

  type Props = Omit<HTMLAttributes<HTMLElement>, "class" | "children"> & {
    size?: "sm" | "md";
    class?: ClassValue;
    children: Snippet;
  };

  let { size = "md", class: className, children, ...rest }: Props = $props();
</script>

<kbd {...rest} class={["ld-kbd", className]} data-size={size}>
  {@render children()}
</kbd>

<style>
  @layer theme, base, components;

  @layer components {
    .ld-kbd {
      --kbd-size: 1.5rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: var(--kbd-size);
      min-width: var(--kbd-size);
      padding-inline: 0.5em;
      border: 1px solid var(--border-strong);
      border-bottom-width: 2px;
      border-radius: 0.75rem;
      background-color: var(--surface-elevated);
      font-size: 0.875rem;
      vertical-align: middle;
    }

    .ld-kbd[data-size="sm"] {
      --kbd-size: 1.25rem;
      font-size: 0.75rem;
    }
  }
</style>
