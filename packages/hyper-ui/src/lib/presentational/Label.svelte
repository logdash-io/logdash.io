<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLLabelAttributes } from "svelte/elements";

  type Props = HTMLLabelAttributes & {
    children: Snippet;
  };

  let { class: className, children, ...rest }: Props = $props();
</script>

<label {...rest} class={["ld-label", className]}>
  {@render children()}
</label>

<style>
  @layer theme, base, components;

  @layer components {
    .ld-label {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      white-space: nowrap;
      color: var(--fg-secondary);
    }

    .ld-label:has(:global(input)) {
      cursor: pointer;
    }
  }
</style>
