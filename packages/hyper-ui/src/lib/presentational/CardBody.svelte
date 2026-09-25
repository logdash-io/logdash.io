<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  type Props = HTMLAttributes<HTMLDivElement> & {
    children: Snippet;
  };

  let { class: className, children, ...rest }: Props = $props();
</script>

<div {...rest} class={["ld-card-body", className]}>
  {@render children()}
</div>

<style>
  @layer theme, base, components;

  @layer components {
    .ld-card-body {
      display: flex;
      flex: auto;
      flex-direction: column;
      gap: 0.5rem;
      padding: 1.5rem;
      font-size: 0.875rem;
    }

    .ld-card-body :global(p) {
      flex-grow: 1;
    }
  }
</style>
