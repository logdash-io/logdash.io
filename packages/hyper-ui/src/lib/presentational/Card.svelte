<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  type Props = HTMLAttributes<HTMLDivElement> & {
    children: Snippet;
  };

  let { class: className, children, ...rest }: Props = $props();
</script>

<div {...rest} class={["ld-card-box", className]}>
  {@render children()}
</div>

<style>
  @layer theme, base, components;

  @layer components {
    .ld-card-box {
      position: relative;
      display: flex;
      flex-direction: column;
      border-radius: 0.75rem;
    }
  }
</style>
