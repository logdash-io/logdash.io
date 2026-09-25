<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  type Props = HTMLAttributes<HTMLHeadingElement> & {
    children: Snippet;
  };

  let { class: className, children, ...rest }: Props = $props();
</script>

<h2 {...rest} class={["ld-card-title", className]}>
  {@render children()}
</h2>

<style>
  @layer theme, base, components;

  @layer components {
    .ld-card-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.125rem;
      font-weight: 600;
    }
  }
</style>
