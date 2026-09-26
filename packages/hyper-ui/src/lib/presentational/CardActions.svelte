<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  type Props = HTMLAttributes<HTMLDivElement> & {
    children: Snippet;
  };

  let { class: className, children, ...rest }: Props = $props();
</script>

<div {...rest} class={["ld-card-actions", className]}>
  {@render children()}
</div>

<style>
  @layer theme, base, components;

  @layer components {
    .ld-card-actions {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      gap: 0.5rem;
    }
  }
</style>
