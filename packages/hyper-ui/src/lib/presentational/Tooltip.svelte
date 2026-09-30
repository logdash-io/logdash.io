<script lang="ts">
  import { tick, type Snippet } from "svelte";
  import { cubicInOut } from "svelte/easing";
  import type { ClassValue } from "svelte/elements";
  import { fly } from "svelte/transition";
  import { match } from "ts-pattern";

  const debug = (...args: any[]) => {
    // console.log(...args);
  };

  type SnippetWithClose = (close: () => void) => ReturnType<Snippet>;

  type Props = {
    content: string | Snippet<[() => void]> | SnippetWithClose;
    placement: "top" | "bottom" | "left" | "right";
    children: Snippet;
    class?: ClassValue;
    trigger?: "hover" | "click";
    interactive?: boolean;
    align?: "left" | "center" | "right" | "top" | "bottom";
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

  const FOCUSABLE = "a[href], button, input, select, textarea, [tabindex]";

  let wrapper: HTMLSpanElement;
  let tooltip = $state<HTMLDivElement | null>(null);
  let portalContainer: HTMLDivElement | null = null;

  let visible = $state(false);
  let focusOnOpen = false;
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
    (wrapper.closest("dialog[open]") ?? document.body).appendChild(
      portalContainer
    );

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
    const focused = node.contains(document.activeElement)
      ? document.activeElement
      : null;
    target.appendChild(node);
    if (focused instanceof HTMLElement) {
      focused.focus();
    }
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

  function close(): void {
    returnFocus();
    visible = false;
  }

  function returnFocus(): void {
    if (tooltip?.contains(document.activeElement)) {
      triggerElement()?.focus();
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
      focusOnOpen = !visible && event.detail === 0;
      toggle();
    }
  }

  function handleEscape(event: KeyboardEvent) {
    if (
      event.key !== "Escape" ||
      !visible ||
      event.defaultPrevented ||
      tooltip?.contains(event.target as Node)
    ) {
      return;
    }

    event.preventDefault();
    hide();
  }

  function onTooltipKeydown(event: KeyboardEvent): void {
    const root = tooltip;
    if (trigger !== "click" || !root || event.defaultPrevented) {
      return;
    }

    match(event.key)
      .with("Escape", () => {
        event.preventDefault();
        close();
      })
      .with("Tab", () => leaveOnTab(event, root))
      .with("ArrowDown", "ArrowUp", () => moveWithinList(event, root))
      .otherwise(() => {});
  }

  function leaveOnTab(event: KeyboardEvent, root: HTMLElement): void {
    const items = focusables(root);
    const current = items.indexOf(document.activeElement as HTMLElement);
    const edge = event.shiftKey ? 0 : items.length - 1;
    if (current !== -1 && current !== edge) {
      return;
    }

    event.preventDefault();
    close();
  }

  function moveWithinList(event: KeyboardEvent, root: HTMLElement): void {
    const list = (event.target as Element).closest("ul");
    if (!list || !root.contains(list)) {
      return;
    }

    const items = focusables(list).filter(
      (item) => item.closest("ul") === list
    );
    const current = items.indexOf(event.target as HTMLElement);
    if (current === -1) {
      return;
    }

    event.preventDefault();
    const step = event.key === "ArrowDown" ? 1 : -1;
    items[(current + step + items.length) % items.length].focus();
  }

  function focusables(root: HTMLElement): HTMLElement[] {
    return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
      (element) =>
        element.tabIndex >= 0 &&
        !element.matches(":disabled") &&
        element.checkVisibility()
    );
  }

  function triggerElement(): HTMLElement | null {
    return wrapper.querySelector<HTMLElement>(FOCUSABLE);
  }

  function handleClickOutside(event: MouseEvent) {
    const path = event.composedPath();
    if (
      trigger === "click" &&
      visible &&
      tooltip &&
      !path.includes(tooltip) &&
      !path.includes(wrapper)
    ) {
      const isInsideAnyTooltip = path.some(
        (node) =>
          node instanceof Element && node.hasAttribute("data-tooltip-portal")
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

    let top: number;
    let left: number;

    if (placement === "left" || placement === "right") {
      if (align === "top") {
        top = triggerRect.top;
      } else if (align === "bottom") {
        top = triggerRect.bottom - tooltipRect.height;
      } else {
        top =
          triggerRect.top +
          (triggerRect.height - tooltipRect.height) / 2;
      }

      left =
        placement === "left"
          ? triggerRect.left - tooltipRect.width - margin
          : triggerRect.right + margin;
    } else {
      top = match(placement)
        .with(
          "top",
          () => triggerRect.top - tooltipRect.height - margin
        )
        .with("bottom", () => triggerRect.bottom + margin)
        .exhaustive();

      left = match(align)
        .with("left", () => triggerRect.left)
        .with(
          "right",
          () => triggerRect.right - tooltipRect.width
        )
        .otherwise(
          () =>
            triggerRect.left +
            (triggerRect.width - tooltipRect.width) / 2
        );
    }

    // Adjust horizontal position to stay within screen bounds
    const minLeft = margin;
    const maxLeft = viewportWidth - tooltipRect.width - margin;
    if (left < minLeft) {
      left = minLeft;
    } else if (left > maxLeft) {
      left = maxLeft;
    }

    // Adjust vertical position to stay within screen bounds
    const minTop = margin;
    const maxTop =
      viewportHeight - tooltipRect.height - margin;
    if (top < minTop) {
      // If tooltip would go above screen, show it below the trigger instead
      top = triggerRect.bottom + margin;
    } else if (top > maxTop) {
      // If tooltip would go below screen, show it above the trigger instead
      top = triggerRect.top - tooltipRect.height - margin;
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
      document.addEventListener("keydown", handleEscape);
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
        document.removeEventListener("keydown", handleEscape);
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

  $effect(() => {
    if (!tooltip || !focusOnOpen) {
      return;
    }

    focusOnOpen = false;
    if (!tooltip.contains(document.activeElement)) {
      focusables(tooltip)[0]?.focus();
    }
  });

  $effect(() => {
    if (trigger === "click") {
      triggerElement()?.setAttribute("aria-expanded", String(visible));
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
      role="presentation"
      class={[
        "absolute",
        {
          "bg-surface-100 rounded-lg px-3 py-1 text-sm whitespace-nowrap text-white shadow":
            !isSnippet,
        },
      ]}
      style="top: 0; left: 0; pointer-events: {interactive ? 'auto' : 'none'};"
      onclick={(e) => e.stopPropagation()}
      onkeydown={onTooltipKeydown}
      use:portal={container}
    >
      {#if isSnippet}
        {@render content(() => {
          returnFocus();
          setTimeout(() => {
            debug("hiding tooltip via snippet");
            close();
          });
        })}
      {:else}
        {content}
      {/if}
    </div>
  {/if}
{/if}
