<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  type Props = HTMLAttributes<HTMLSpanElement> & {
    active: boolean;
    on: Snippet;
    off: Snippet;
  };

  let { active, on, off, class: className, ...rest }: Props = $props();
</script>

<span
  {...rest}
  class={["ld-swap", className]}
  data-active={active || undefined}
>
  <span class="ld-swap-on" aria-hidden={!active}>{@render on()}</span>
  <span class="ld-swap-off" aria-hidden={active}>{@render off()}</span>
</span>

<style>
  @layer theme, base, components;

  @layer components {
    .ld-swap {
      position: relative;
      display: inline-grid;
      place-content: center;
      vertical-align: middle;
      user-select: none;
    }

    .ld-swap > span {
      display: grid;
      grid-row-start: 1;
      grid-column-start: 1;
      place-items: center;
    }

    .ld-swap-on {
      opacity: 0;
      rotate: 45deg;
    }

    .ld-swap[data-active] > .ld-swap-on {
      opacity: 1;
      rotate: 0deg;
    }

    .ld-swap[data-active] > .ld-swap-off {
      opacity: 0;
      rotate: -45deg;
    }

    @media (prefers-reduced-motion: no-preference) {
      .ld-swap > span {
        transition-property: transform, rotate, opacity;
        transition-duration: 0.2s;
        transition-timing-function: cubic-bezier(0, 0, 0.2, 1);
      }
    }
  }
</style>
