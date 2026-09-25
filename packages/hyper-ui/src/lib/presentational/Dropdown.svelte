<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  type TriggerAttributes = {
    popovertarget: string;
    style: string;
  };

  type Props = HTMLAttributes<HTMLDivElement> & {
    align?: "start" | "center" | "end";
    trigger: Snippet<[TriggerAttributes]>;
    children: Snippet;
  };

  let {
    align = "start",
    trigger,
    class: className,
    children,
    ...rest
  }: Props = $props();

  const id = $props.id();

  function onContentClick(
    event: MouseEvent & { currentTarget: HTMLDivElement },
  ): void {
    if (!(event.target instanceof Element)) return;
    if (!event.target.closest("a[href], button")) return;
    event.currentTarget.hidePopover();
  }
</script>

{@render trigger({ popovertarget: id, style: `anchor-name: --${id}` })}

<div
  {...rest}
  {id}
  popover="auto"
  class={["ld-dropdown", className]}
  data-align={align}
  style:position-anchor="--{id}"
  onclick={onContentClick}
>
  {@render children()}
</div>

<style>
  @layer theme, base, components;

  @layer components {
    .ld-dropdown {
      padding: 0;
      border: 0;
      background: transparent;
      color: inherit;
      overflow: visible;
    }

    @supports (position-area: bottom) {
      .ld-dropdown {
        inset: auto;
        margin: 0;
        position-area: bottom span-right;
      }

      .ld-dropdown[data-align="center"] {
        position-area: bottom center;
      }

      .ld-dropdown[data-align="end"] {
        position-area: bottom span-left;
      }
    }

    @media (prefers-reduced-motion: no-preference) {
      .ld-dropdown {
        transition-property: opacity, scale, overlay, display;
        transition-behavior: allow-discrete;
        transition-duration: 0.2s;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transform-origin: top;
      }

      .ld-dropdown:not(:popover-open) {
        opacity: 0;
        scale: 0.95;
      }

      @starting-style {
        .ld-dropdown:popover-open {
          opacity: 0;
          scale: 0.95;
        }
      }
    }
  }
</style>
