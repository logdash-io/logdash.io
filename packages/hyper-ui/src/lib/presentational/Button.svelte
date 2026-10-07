<script lang="ts">
  import type { Snippet } from "svelte";
  import { fromAction } from "svelte/attachments";
  import type {
    ClassValue,
    HTMLAnchorAttributes,
    HTMLButtonAttributes,
  } from "svelte/elements";
  import { press } from "../utils/press";
  import Spinner from "./Spinner.svelte";

  type Props = Omit<
    HTMLButtonAttributes & HTMLAnchorAttributes,
    "class" | "children" | "type" | "disabled"
  > & {
    variant?: "primary" | "secondary" | "ghost" | "danger" | "danger-ghost";
    size?: "xs" | "sm" | "md" | "lg";
    shape?: "pill" | "square" | "circle";
    block?: boolean;
    loading?: boolean;
    href?: string;
    as?: "button" | "span";
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
    class?: ClassValue;
    children: Snippet;
  };

  let {
    variant = "secondary",
    size = "md",
    shape = "pill",
    block = false,
    loading = false,
    href,
    as = "button",
    type = "button",
    disabled = false,
    class: className,
    children,
    ...rest
  }: Props = $props();

  const SPINNER_SIZES = { xs: "xs", sm: "xs", md: "sm", lg: "md" } as const;

  const tag = $derived(href ? "a" : as);
  const inert = $derived(disabled || loading);
</script>

<svelte:element
  this={tag}
  {...rest}
  href={inert ? undefined : href}
  type={tag === "button" ? type : undefined}
  disabled={tag === "button" ? inert : undefined}
  aria-disabled={tag === "a" && inert ? "true" : undefined}
  aria-busy={loading || undefined}
  class={["ld-button", className]}
  data-variant={variant}
  data-size={size}
  data-shape={shape}
  data-block={block || undefined}
  {@attach fromAction(press)}
>
  {#if loading}
    <span class="ld-button-content">{@render children()}</span>
    <span class="ld-button-spinner">
      <Spinner size={SPINNER_SIZES[size]} aria-hidden="true" />
    </span>
  {:else}
    {@render children()}
  {/if}
</svelte:element>

<style>
  @layer theme, base, components;

  @layer components {
    .ld-button {
      --button-bg: var(--surface-150-bg);
      --button-hover-bg: var(--surface-150-hover-bg);
      --button-ring: var(--surface-150-border);
      --button-fg: var(--fg-default);
      --button-hover-fg: var(--fg-default);
      --button-focus: var(--brand);
      --button-size: 2.5rem;
      position: relative;
      display: inline-flex;
      flex-shrink: 0;
      flex-wrap: nowrap;
      align-items: center;
      justify-content: center;
      gap: 0.375rem;
      height: var(--button-size);
      padding-inline: 1rem;
      border: 0;
      border-radius: calc(infinity * 1px);
      background-color: var(--button-bg);
      box-shadow: inset 0 0 0 1px var(--button-ring);
      color: var(--button-fg);
      font-size: 0.9375rem;
      font-weight: 500;
      /* Own the line-height so the label sits the same in every context. */
      line-height: 1;
      text-align: center;
      text-decoration: none;
      white-space: nowrap;
      vertical-align: middle;
      cursor: pointer;
      -webkit-user-select: none;
      user-select: none;
      touch-action: manipulation;
      transition: color 0.2s cubic-bezier(0, 0, 0.2, 1);
    }

    .ld-button[data-size="xs"] {
      --button-size: 1.5rem;
      padding-inline: 0.5rem;
      font-size: 0.8125rem;
    }

    .ld-button[data-size="sm"] {
      --button-size: 2rem;
      padding-inline: 0.75rem;
      font-size: 0.875rem;
    }

    .ld-button[data-size="lg"] {
      --button-size: 3rem;
      padding-inline: 1.25rem;
      font-size: 1.125rem;
    }

    .ld-button[data-shape="square"],
    .ld-button[data-shape="circle"] {
      width: var(--button-size);
      padding-inline: 0;
    }

    .ld-button[data-shape="square"] {
      border-radius: 0.75rem;
    }

    .ld-button[data-block] {
      width: 100%;
    }

    .ld-button[data-variant="primary"] {
      --button-bg: var(--surface-inverse-bg);
      --button-hover-bg: var(--surface-inverse-hover-bg);
      --button-ring: transparent;
      --button-fg: var(--fg-inverse);
      --button-hover-fg: var(--fg-inverse);
    }

    .ld-button[data-variant="ghost"] {
      --button-bg: transparent;
      --button-ring: transparent;
      --button-fg: var(--fg-secondary);
    }

    .ld-button[data-variant="danger"],
    .ld-button[data-variant="danger-ghost"] {
      --button-hover-bg: color-mix(in oklab, var(--error) 28%, var(--surface-150-bg));
      --button-ring: transparent;
      --button-fg: var(--error-fg);
      --button-hover-fg: var(--error-fg);
      --button-focus: var(--error);
    }

    .ld-button[data-variant="danger"] {
      --button-bg: color-mix(in oklab, var(--error) 18%, var(--surface-150-bg));
    }

    .ld-button[data-variant="danger-ghost"] {
      --button-bg: transparent;
    }

    @media (hover: hover) {
      .ld-button:hover {
        background-color: var(--button-hover-bg);
        color: var(--button-hover-fg);
      }
    }

    .ld-button:active {
      background-color: var(--button-hover-bg);
      color: var(--button-hover-fg);
    }

    .ld-button:focus-visible {
      outline: none;
      box-shadow:
        inset 0 0 0 1px var(--button-ring),
        0 0 0 1px var(--button-focus),
        0 0 0 4px color-mix(in oklab, var(--button-focus) 20%, transparent);
      isolation: isolate;
    }

    .ld-button:disabled,
    .ld-button[aria-disabled="true"] {
      --button-bg: var(--surface-150-bg);
      --button-hover-bg: var(--surface-150-bg);
      --button-ring: var(--surface-150-border);
      --button-fg: var(--fg-faint);
      --button-hover-fg: var(--fg-faint);
      pointer-events: none;
    }

    .ld-button[data-variant="ghost"]:is(:disabled, [aria-disabled="true"]),
    .ld-button[data-variant="danger-ghost"]:is(:disabled, [aria-disabled="true"]) {
      --button-bg: transparent;
      --button-hover-bg: transparent;
      --button-ring: transparent;
    }

    .ld-button-content {
      display: inline-flex;
      align-items: center;
      gap: inherit;
      opacity: 0;
    }

    .ld-button-spinner {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
    }
  }
</style>
