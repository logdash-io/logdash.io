<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  type Props = HTMLAttributes<HTMLDivElement> & {
    size?: "xs" | "sm" | "md";
    boxed?: boolean;
    children: Snippet;
  };

  let {
    size = "md",
    boxed = false,
    class: className,
    children,
    ...rest
  }: Props = $props();

  function onKeydown(event: KeyboardEvent): void {
    if (!(event.currentTarget instanceof HTMLElement)) return;
    const tabs = [
      ...event.currentTarget.querySelectorAll<HTMLElement>(
        '[role="tab"]:not(:disabled)',
      ),
    ];
    const current = tabs.findIndex((tab) => tab === document.activeElement);
    const next = nextIndex(event.key, current, tabs.length);
    if (next === null) return;
    event.preventDefault();
    tabs[next].focus();
    tabs[next].click();
  }

  function nextIndex(
    key: string,
    current: number,
    count: number,
  ): number | null {
    if (!count) return null;
    if (key === "Home") return 0;
    if (key === "End") return count - 1;
    if (key === "ArrowRight") return (current + 1) % count;
    if (key === "ArrowLeft") return (current - 1 + count) % count;
    return null;
  }
</script>

<div
  role="tablist"
  tabindex="-1"
  {...rest}
  class={["ld-tabs", className]}
  data-size={size}
  data-boxed={boxed || undefined}
  onkeydown={onKeydown}
>
  {@render children()}
</div>

<style>
  @layer theme, base, components;

  @layer components {
    .ld-tabs {
      --tab-height: 2.5rem;
      --tab-padding: 0.75rem;
      --tab-font-size: 0.875rem;
      display: flex;
      flex-wrap: wrap;
      border-radius: 0.75rem;
    }

    .ld-tabs[data-size="sm"] {
      --tab-height: 2rem;
      --tab-padding: 0.5rem;
    }

    .ld-tabs[data-size="xs"] {
      --tab-height: 1.5rem;
      --tab-padding: 0.375rem;
      --tab-font-size: 0.75rem;
    }

    .ld-tabs[data-boxed] {
      padding: 0.25rem;
      background-color: var(--surface-100);
    }
  }
</style>
