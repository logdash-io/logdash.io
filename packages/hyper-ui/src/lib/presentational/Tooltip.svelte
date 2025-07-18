<script lang="ts">
  import { tick, type Snippet } from "svelte";
  import { cubicInOut } from "svelte/easing";
  import type { ClassValue } from "svelte/elements";
  import { fly } from "svelte/transition";
  import { match } from "ts-pattern";

  const debug = (...args: any[]) => {
    // console.log(...args);
  };

  type Props = {
    content: string | Snippet<[() => void]>;
    placement: "top" | "bottom";
    children: Snippet;
    class?: ClassValue;
    trigger?: "hover" | "click";
    interactive?: boolean;
    align?: "left" | "center" | "right";
    closeOnOutsideTooltipClick?: boolean;
  };
  const {
    children,
    class: className,
    content,
    placement,
    trigger = "hover",
    interactive = false,
    align = "center",
    closeOnOutsideTooltipClick = false,
  }: Props = $props();

  let wrapper: HTMLSpanElement;
  let tooltip: HTMLDivElement | null = null;
  let portalContainer: HTMLDivElement | null = null;

  let visible = $state(false);
  let coords = { top: 0, left: 0 };
  let hideTimeout: ReturnType<typeof setTimeout> | null = null;

  function createPortalContainer() {
    if (portalContainer) {
      debug("returning existing portalContainer");
      return portalContainer;
    }

    portalContainer = document.createElement("div");
    portalContainer.style.position = "fixed";
    portalContainer.style.top = "0";
    portalContainer.style.left = "0";
    portalContainer.style.zIndex = "1000";
    document.body.appendChild(portalContainer);

    debug("created new portalContainer");

    return portalContainer;
  }

  function destroyPortalContainer() {
    // Clean up interactive listeners before destroying tooltip
    if (tooltip && trigger === "hover" && interactive) {
      tooltip.removeEventListener("mouseenter", show);
      tooltip.removeEventListener("mouseleave", hide);
    }

    if (portalContainer && portalContainer.parentNode) {
      debug("destroying portalContainer");
      portalContainer.parentNode.removeChild(portalContainer);
      portalContainer = null;
      tooltip = null;
    }
  }

  function portal(node: HTMLElement, target: HTMLElement) {
    target.appendChild(node);
    return {
      destroy() {
        if (node.parentNode === target) {
          target.removeChild(node);
        }
      },
    };
  }

  function show() {
    // Clear any pending hide timeout
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }
    visible = true;
    tick().then(positionTooltip);
  }

  function hide() {
    // Only add delay for interactive tooltips on hover trigger
    if (interactive && trigger === "hover") {
      hideTimeout = setTimeout(() => {
        visible = false;
        hideTimeout = null;
      }, 200); // 200ms delay
    } else {
      visible = false;
    }
  }

  function toggle() {
    if (visible) {
      hide();
    } else {
      show();
    }
  }

  function handleClick(event: MouseEvent) {
    if (trigger === "click") {
      event.stopPropagation();
      toggle();
    }
  }

  function handleClickOutside(event: MouseEvent) {
    if (
      trigger === "click" &&
      visible &&
      tooltip &&
      !tooltip.contains(event.target as Node) &&
      !wrapper.contains(event.target as Node)
    ) {
      const clickTarget = event.target as Element;
      const allTooltips = document.querySelectorAll("[data-tooltip-portal]");
      debug("allTooltips", allTooltips);
      const isInsideAnyTooltip = Array.from(allTooltips).some((tooltipEl) =>
        tooltipEl.contains(clickTarget)
      );

      // Respect the closeOnOutsideTooltipClick flag
      if (closeOnOutsideTooltipClick) {
        // Close even when clicking on other tooltips
        debug(
          "hiding tooltip via click outside (closeOnOutsideTooltipClick=true)"
        );
        hide();
      } else {
        // Only close when clicking truly outside all tooltips
        if (!isInsideAnyTooltip) {
          debug(
            "hiding tooltip via click outside (closeOnOutsideTooltipClick=false)"
          );
          hide();
        }
      }
    }
  }

  function positionTooltip() {
    if (!tooltip || !wrapper) return;

    const triggerRect = wrapper.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 8;

    let top = match(placement)
      .with(
        "top",
        () => triggerRect.top - tooltipRect.height - margin + window.scrollY
      )
      .with("bottom", () => triggerRect.bottom + margin + window.scrollY)
      .exhaustive();

    let left = match(align)
      .with("left", () => triggerRect.left + window.scrollX)
      .with(
        "right",
        () => triggerRect.right - tooltipRect.width + window.scrollX
      )
      .with(
        "center",
        () =>
          triggerRect.left +
          (triggerRect.width - tooltipRect.width) / 2 +
          window.scrollX
      )
      .exhaustive();

    // Adjust horizontal position to stay within screen bounds
    const minLeft = margin + window.scrollX;
    const maxLeft = viewportWidth - tooltipRect.width - margin + window.scrollX;
    if (left < minLeft) {
      left = minLeft;
    } else if (left > maxLeft) {
      left = maxLeft;
    }

    // Adjust vertical position to stay within screen bounds
    const minTop = margin + window.scrollY;
    const maxTop =
      viewportHeight - tooltipRect.height - margin + window.scrollY;
    if (top < minTop) {
      // If tooltip would go above screen, show it below the trigger instead
      top = triggerRect.bottom + margin + window.scrollY;
    } else if (top > maxTop) {
      // If tooltip would go below screen, show it above the trigger instead
      top = triggerRect.top - tooltipRect.height - margin + window.scrollY;
    }

    coords = { top, left };

    tooltip.style.position = "fixed";
    tooltip.style.zIndex = "1000";
    tooltip.style.top = coords.top + "px";
    tooltip.style.left = coords.left + "px";

    // Set up interactive listeners after positioning when tooltip is ready
    if (trigger === "hover" && interactive) {
      tooltip.addEventListener("mouseenter", show);
      tooltip.addEventListener("mouseleave", hide);
    }
  }

  $effect(() => {
    if (trigger === "hover") {
      wrapper.addEventListener("mouseenter", show);
      wrapper.addEventListener("mouseleave", hide);

      // Note: Interactive tooltip listeners are handled in a separate effect
    } else if (trigger === "click") {
      wrapper.addEventListener("click", handleClick);
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      // Clear any pending timeout on cleanup
      if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
      }

      if (trigger === "hover") {
        wrapper.removeEventListener("mouseenter", show);
        wrapper.removeEventListener("mouseleave", hide);
      } else if (trigger === "click") {
        wrapper.removeEventListener("click", handleClick);
        document.removeEventListener("click", handleClickOutside);
      }
    };
  });

  $effect(() => {
    function handleWindowResize() {
      if (visible && tooltip) {
        positionTooltip();
      }
    }

    window.addEventListener("resize", handleWindowResize);

    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  });

  $effect(() => {
    if (!visible) {
      destroyPortalContainer();
    }
  });

  $effect(() => {
    return () => {
      destroyPortalContainer();
    };
  });

  // Position tooltip immediately when it's bound
  $effect(() => {
    if (visible && tooltip) {
      positionTooltip();
    }
  });
</script>

<span class={["flex", className]} bind:this={wrapper}>
  {@render children()}
</span>

{#if visible}
  {@const isSnippet = typeof content === "function"}
  {@const container = createPortalContainer()}
  {#if container}
    <div
      transition:fly={{ y: 5, easing: cubicInOut, duration: 200 }}
      bind:this={tooltip}
      data-tooltip-portal
      class={[
        "absolute",
        {
          "bg-base-100 rounded-lg px-3 py-1 text-sm text-white shadow":
            !isSnippet,
        },
      ]}
      style="top: 0; left: 0; pointer-events: {interactive ? 'auto' : 'none'};"
      onclick={(e) => e.stopPropagation()}
      use:portal={container}
    >
      {#if isSnippet}
        {@render content(() => {
          setTimeout(() => {
            debug("hiding tooltip via snippet");
            visible = false;
          });
        })}
      {:else}
        {content}
      {/if}
    </div>
  {/if}
{/if}
