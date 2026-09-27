<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  type Props = HTMLAttributes<HTMLUListElement> & {
    size?: "sm" | "md";
    children: Snippet;
  };

  let { size = "md", class: className, children, ...rest }: Props = $props();

  const ITEMS =
    "li > a[href], li > button:not(:disabled), li > details > summary";

  function onKeydown(event: KeyboardEvent): void {
    const step =
      event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0;
    if (!step || !(event.currentTarget instanceof HTMLElement)) return;
    const items = [
      ...event.currentTarget.querySelectorAll<HTMLElement>(ITEMS),
    ].filter((item) => item.checkVisibility());
    if (!items.length) return;
    event.preventDefault();
    const current = items.findIndex((item) => item === document.activeElement);
    items[(current + step + items.length) % items.length].focus();
  }
</script>

<ul
  {...rest}
  class={["ld-menu", className]}
  data-size={size}
  onkeydown={onKeydown}
>
  {@render children()}
</ul>

<style>
  @layer theme, base, components;

  @layer components {
    .ld-menu {
      display: flex;
      flex-direction: column;
      flex-wrap: wrap;
      width: fit-content;
      padding: 0.375rem;
      font-size: 0.875rem;
    }

    .ld-menu :global {
      li {
        position: relative;
        display: flex;
        flex-direction: column;
        flex-wrap: wrap;
        flex-shrink: 0;
        align-items: stretch;
      }

      li ul {
        position: relative;
        margin-inline-start: 1rem;
        padding-inline-start: 0.5rem;
        white-space: nowrap;
      }

      li ul::before {
        content: "";
        position: absolute;
        inset-inline-start: 0;
        top: 0.75rem;
        bottom: 0.75rem;
        width: 1px;
        background-color: var(--border-default);
      }

      li > :not(ul, details, .ld-button),
      li > details > summary {
        display: grid;
        grid-auto-flow: column;
        grid-auto-columns: minmax(auto, max-content) auto max-content;
        align-content: flex-start;
        align-items: center;
        gap: 0.5rem;
        padding: 0.375rem 0.75rem;
        border-radius: 0.75rem;
        text-align: start;
        text-wrap: balance;
        user-select: none;
        transition: color 0.2s cubic-bezier(0, 0, 0.2, 1);
      }

      li > :not(ul, details, .ld-button):hover,
      li > details > summary:hover {
        cursor: pointer;
        background-color: var(--surface-100);
      }

      li > :not(ul, details, .ld-button):focus-visible,
      li > details > summary:focus-visible {
        outline: none;
        background-color: var(--surface-100);
        box-shadow: var(--focus-ring);
      }

      li > :not(ul, details, .ld-button):active,
      li > details > summary:active {
        background-color: var(--surface-100);
        color: var(--fg-default);
      }

      li > details > summary {
        list-style: none;
      }

      li > details > summary::-webkit-details-marker {
        display: none;
      }

      li > details > summary::after {
        content: "";
        display: block;
        justify-self: flex-end;
        width: 0.375rem;
        height: 0.375rem;
        rotate: -135deg;
        translate: 0 -1px;
        transform-origin: 50% 50%;
        box-shadow: 2px 2px inset;
        pointer-events: none;
        transition-property: rotate, translate;
        transition-duration: 0.2s;
      }

      li > details[open] > summary::after {
        rotate: 45deg;
        translate: 0 1px;
      }

      details {
        overflow: hidden;
        interpolate-size: allow-keywords;
      }

      details::details-content {
        block-size: 0;
      }

      details[open]::details-content {
        block-size: auto;
      }
    }

    .ld-menu[data-size="sm"] :global {
      li > :not(ul, details, .ld-button),
      li > details > summary {
        padding: 0.25rem 0.625rem;
        font-size: 0.75rem;
      }
    }

    @media (prefers-reduced-motion: no-preference) {
      .ld-menu :global(details::details-content) {
        transition-behavior: allow-discrete;
        transition-property: block-size, content-visibility;
        transition-duration: 0.2s;
        transition-timing-function: cubic-bezier(0, 0, 0.2, 1);
      }
    }
  }
</style>
