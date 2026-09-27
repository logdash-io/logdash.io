<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  type Props = HTMLAttributes<HTMLDivElement> & {
    children?: Snippet;
  };

  let { class: className, children, ...rest }: Props = $props();
</script>

<div {...rest} class={["ld-divider", className]}>
  {@render children?.()}
</div>

<style>
  @layer theme, base, components;

  @layer components {
    .ld-divider {
      display: flex;
      flex-direction: row;
      align-items: center;
      align-self: stretch;
      height: 1rem;
      margin: 1rem 0;
      white-space: nowrap;
    }

    .ld-divider:not(:empty) {
      gap: 1rem;
    }

    .ld-divider::before,
    .ld-divider::after {
      content: "";
      flex-grow: 1;
      width: 100%;
      height: 0.125rem;
      background-color: var(--hairline);
    }
  }
</style>
