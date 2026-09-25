<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  type Props = HTMLAttributes<HTMLDivElement> & {
    children: Snippet;
  };

  let { class: className, children, ...rest }: Props = $props();
</script>

<div {...rest} class={["ld-join", className]}>
  {@render children()}
</div>

<style>
  @layer theme, base, components;

  @layer components {
    .ld-join {
      display: inline-flex;
      align-items: stretch;
    }

    .ld-join > :global(:not(:first-child, :disabled)) {
      margin-inline-start: -1px;
    }

    .ld-join > :global(:not(:first-child)) {
      border-start-start-radius: 0;
      border-end-start-radius: 0;
    }

    .ld-join > :global(:not(:last-child)) {
      border-start-end-radius: 0;
      border-end-end-radius: 0;
    }

    .ld-join > :global(:is(:focus, :has(:focus))) {
      z-index: 1;
    }
  }
</style>
