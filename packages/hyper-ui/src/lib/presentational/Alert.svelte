<script lang="ts">
  import type { Snippet } from "svelte";
  import type { ClassValue, HTMLAttributes } from "svelte/elements";

  type Props = Omit<HTMLAttributes<HTMLDivElement>, "class" | "children"> & {
    variant?: "neutral" | "error" | "warning" | "success" | "info";
    class?: ClassValue;
    children: Snippet;
  };

  let {
    variant = "neutral",
    class: className,
    children,
    ...rest
  }: Props = $props();
</script>

<div {...rest} class={["ld-alert", className]} data-variant={variant}>
  {@render children()}
</div>

<style>
  @layer theme, base, components;

  @layer components {
    .ld-alert {
      display: grid;
      grid-auto-flow: column;
      grid-template-columns: auto;
      justify-content: start;
      place-items: center start;
      gap: 1rem;
      padding-block: 0.75rem;
      padding-inline: 1rem;
      border: 1px solid var(--surface-elevated);
      border-radius: 0.75rem;
      background-color: var(--surface-elevated);
      color: var(--fg-default);
      font-size: 0.875rem;
      line-height: 1.25rem;
      text-align: start;
    }

    .ld-alert:has(:global(:nth-child(2))) {
      grid-template-columns: auto minmax(auto, 1fr);
    }

    .ld-alert[data-variant="error"] {
      --alert-tone: var(--error);
    }

    .ld-alert[data-variant="warning"] {
      --alert-tone: var(--warning);
      color: var(--warning);
    }

    .ld-alert[data-variant="success"] {
      --alert-tone: var(--success);
    }

    .ld-alert[data-variant="info"] {
      --alert-tone: var(--info);
    }

    .ld-alert:not([data-variant="neutral"]) {
      border-color: color-mix(in oklab, var(--alert-tone) 30%, transparent);
      background-color: color-mix(in oklab, var(--alert-tone) 10%, transparent);
    }
  }
</style>
