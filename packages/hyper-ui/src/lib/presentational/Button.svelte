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
    variant?:
      | "primary"
      | "secondary"
      | "subtle"
      | "neutral"
      | "ghost"
      | "transparent"
      | "outline"
      | "soft"
      | "danger"
      | "danger-ghost"
      | "danger-soft"
      | "success-soft"
      | "link";
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
      --button-tint: var(--surface-elevated);
      --button-bg: var(--button-tint);
      --button-border: var(--button-bg);
      --button-fg: var(--fg-default);
      --button-hover-fg: var(--button-fg);
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
      border: 1px solid var(--button-border);
      border-radius: calc(infinity * 1px);
      background-color: var(--button-bg);
      color: var(--button-fg);
      font-size: 0.875rem;
      font-weight: 600;
      text-align: center;
      text-decoration: none;
      white-space: nowrap;
      vertical-align: middle;
      cursor: pointer;
      -webkit-user-select: none;
      user-select: none;
      touch-action: manipulation;
      outline-offset: 2px;
      transition: color 0.2s cubic-bezier(0, 0, 0.2, 1);
    }

    .ld-button[data-size="xs"] {
      --button-size: 1.5rem;
      padding-inline: 0.5rem;
      font-size: 0.6875rem;
    }

    .ld-button[data-size="sm"] {
      --button-size: 2rem;
      padding-inline: 0.75rem;
      font-size: 0.75rem;
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
      --button-tint: var(--surface-inverse);
      --button-fg: var(--surface-root);
    }

    .ld-button[data-variant="subtle"] {
      --button-ring: var(--border-default);
      --button-border: transparent;
      box-shadow:
        0 0 0 1px var(--button-ring),
        0 1px 1px rgb(0 0 0 / 0.24),
        0 2px 4px rgb(0 0 0 / 0.24);
    }

    .ld-button[data-variant="neutral"] {
      --button-tint: var(--surface-100);
      --button-border: var(--hairline);
    }

    .ld-button[data-variant="ghost"] {
      --button-bg: transparent;
      --button-fg: currentColor;
      --button-hover-fg: var(--fg-default);
    }

    .ld-button[data-variant="transparent"],
    .ld-button[data-variant="danger"],
    .ld-button[data-variant="danger-ghost"],
    .ld-button[data-variant="danger-soft"] {
      border-width: 0;
    }

    .ld-button[data-variant="transparent"] {
      --button-bg: transparent;
    }

    .ld-button[data-variant="outline"] {
      --button-tint: var(--surface-inverse);
      --button-bg: transparent;
      --button-border: var(--surface-inverse);
      --button-hover-fg: var(--surface-root);
    }

    .ld-button[data-variant="soft"] {
      --button-tint: var(--surface-inverse);
      --button-bg: color-mix(
        in oklab,
        var(--fg-default) 8%,
        var(--surface-100)
      );
      --button-border: color-mix(
        in oklab,
        var(--fg-default) 10%,
        var(--surface-100)
      );
      --button-hover-fg: var(--surface-root);
    }

    .ld-button[data-variant="danger"],
    .ld-button[data-variant="danger-ghost"],
    .ld-button[data-variant="danger-soft"] {
      --button-tint: var(--error-bg-hover);
      --button-bg: var(--error-bg);
      --button-fg: var(--error);
    }

    .ld-button[data-variant="danger-ghost"] {
      --button-bg: transparent;
    }

    .ld-button[data-variant="danger-soft"] {
      --button-bg: color-mix(in oklab, var(--error-bg) 8%, var(--surface-100));
    }

    .ld-button[data-variant="success-soft"] {
      --button-tint: var(--success);
      --button-bg: color-mix(in oklab, var(--success) 8%, var(--surface-100));
      --button-border: color-mix(
        in oklab,
        var(--success) 10%,
        var(--surface-100)
      );
      --button-fg: var(--success);
      --button-hover-fg: oklch(37% 0.077 168.94);
    }

    .ld-button[data-variant="link"] {
      --button-bg: transparent;
      --button-border: transparent;
      text-decoration-line: underline;
    }

    @media (hover: hover) {
      .ld-button:hover {
        --button-bg: color-mix(in oklab, var(--button-tint), #000 7%);
        color: var(--button-hover-fg);
      }
    }

    .ld-button:active {
      --button-bg: color-mix(in oklab, var(--button-tint), #000 5%);
      color: var(--button-hover-fg);
    }

    .ld-button:focus-visible {
      outline: 2px solid var(--brand);
      outline-offset: 2px;
      isolation: isolate;
    }

    @media (hover: hover) {
      .ld-button[data-variant="outline"]:hover,
      .ld-button[data-variant="soft"]:hover,
      .ld-button[data-variant="success-soft"]:hover {
        --button-border: var(--button-bg);
      }

      .ld-button[data-variant="subtle"]:hover {
        --button-bg: var(--surface-100);
        --button-ring: var(--border-strong);
        --button-border: transparent;
      }
    }

    .ld-button[data-variant="outline"]:active,
    .ld-button[data-variant="soft"]:active,
    .ld-button[data-variant="success-soft"]:active {
      --button-border: var(--button-bg);
    }

    .ld-button[data-variant="subtle"]:active {
      --button-bg: var(--surface-100);
      --button-ring: var(--border-strong);
      --button-border: transparent;
    }

    .ld-button[data-variant="transparent"]:is(:hover, :active),
    .ld-button[data-variant="link"]:is(:hover, :active) {
      --button-bg: transparent;
      --button-border: transparent;
    }

    .ld-button:disabled,
    .ld-button[aria-disabled="true"] {
      --button-bg: var(--surface-100);
      --button-border: transparent;
      color: var(--fg-faint);
      box-shadow: none;
      pointer-events: none;
    }

    .ld-button[data-variant="ghost"]:disabled,
    .ld-button[data-variant="ghost"][aria-disabled="true"],
    .ld-button[data-variant="transparent"]:disabled,
    .ld-button[data-variant="transparent"][aria-disabled="true"],
    .ld-button[data-variant="link"]:disabled,
    .ld-button[data-variant="link"][aria-disabled="true"] {
      --button-bg: transparent;
      color: var(--border-strong);
    }

    .ld-button[data-variant="neutral"]:disabled,
    .ld-button[data-variant="neutral"][aria-disabled="true"] {
      --button-border: var(--hairline);
    }

    .ld-button[data-variant="subtle"]:disabled,
    .ld-button[data-variant="subtle"][aria-disabled="true"] {
      color: var(--fg-default);
      box-shadow: 0 0 0 1px var(--hairline);
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
