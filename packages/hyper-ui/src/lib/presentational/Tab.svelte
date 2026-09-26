<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";

  type Props = HTMLButtonAttributes & {
    active?: boolean;
    children: Snippet;
  };

  let { active = false, class: className, children, ...rest }: Props = $props();
</script>

<button
  type="button"
  role="tab"
  {...rest}
  class={["ld-tab", className]}
  aria-selected={active}
>
  {@render children()}
</button>

<style>
  @layer theme, base, components;

  @layer components {
    .ld-tab {
      position: relative;
      display: inline-flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      height: var(--tab-height, 2.5rem);
      padding-inline: var(--tab-padding, 0.75rem);
      border-radius: 0.5rem;
      color: var(--fg-muted);
      font-size: var(--tab-font-size, 0.875rem);
      text-align: center;
      user-select: none;
      cursor: pointer;
      appearance: none;
    }

    .ld-tab[aria-selected="true"] {
      background-color: var(--surface-100);
      color: var(--fg-default);
    }

    .ld-tab:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }

    .ld-tab:disabled {
      pointer-events: none;
      opacity: 0.4;
    }

    @media (hover: hover) {
      .ld-tab:hover {
        color: var(--fg-default);
      }
    }
  }
</style>
