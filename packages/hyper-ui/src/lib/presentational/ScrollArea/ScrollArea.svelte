<script lang="ts">
  import type { ScrollAreaProps } from "./ScrollArea.types";

  let {
    class: className = "",
    orientation = "y",
    viewportRef = $bindable(null),
    onscroll,
    children,
  }: ScrollAreaProps = $props();
</script>

<!--
  A clipped region that scrolls natively. The scrollbar is the browser's own,
  styled globally in styles/scrollbar.css. A stable gutter keeps content from
  shifting when a vertical scrollbar appears or disappears.
-->
<div class="scroll-area-root relative overflow-hidden {className}">
  <div
    bind:this={viewportRef}
    class={[
      "scroll-area-viewport z-0 h-full w-full",
      {
        "overflow-auto [scrollbar-gutter:stable]": orientation === "xy",
        "overflow-x-auto overflow-y-hidden": orientation === "x",
        "overflow-x-hidden overflow-y-auto [scrollbar-gutter:stable]":
          orientation === "y",
      },
    ]}
    {onscroll}
  >
    {@render children()}
  </div>
</div>
