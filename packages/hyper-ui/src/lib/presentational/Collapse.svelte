<script lang="ts">
  import type { Snippet } from "svelte";
  import type { ClassValue, HTMLAttributes } from "svelte/elements";

  type Props = Omit<HTMLAttributes<HTMLElement>, "title"> & {
    open?: boolean;
    locked?: boolean;
    title: Snippet;
    titleClass?: ClassValue;
    contentClass?: ClassValue;
    children: Snippet;
  };

  let {
    open = $bindable(false),
    locked = false,
    title,
    titleClass,
    contentClass,
    class: className,
    children,
    ...rest
  }: Props = $props();
</script>

{#if locked}
  <div
    {...rest}
    class={["ld-collapse", className]}
    data-open={open || undefined}
  >
    <div class={["ld-collapse-title", titleClass]}>{@render title()}</div>
    <div class={["ld-collapse-content", contentClass]}>
      {@render children()}
    </div>
  </div>
{:else}
  <details {...rest} class={["ld-collapse", className]} bind:open>
    <summary class={["ld-collapse-title", titleClass]}
      >{@render title()}</summary
    >
    <div class={["ld-collapse-content", contentClass]}>
      {@render children()}
    </div>
  </details>
{/if}

<style>
  @layer theme, base, components;

  @layer components {
    .ld-collapse {
      position: relative;
      display: grid;
      grid-template-rows: max-content 0fr;
      grid-template-columns: minmax(0, 1fr);
      width: 100%;
      border-radius: 0.75rem;
      overflow: hidden;
      isolation: isolate;
    }

    .ld-collapse[open],
    .ld-collapse[data-open] {
      grid-template-rows: max-content 1fr;
    }

    .ld-collapse:has(> .ld-collapse-title:focus-visible) {
      box-shadow: var(--focus-ring);
    }

    .ld-collapse-title {
      position: relative;
      display: block;
      grid-row-start: 1;
      grid-column-start: 1;
      width: 100%;
      min-height: 1lh;
      padding: 1rem 3rem 1rem 1rem;
      list-style: none;
      outline: none;
    }

    summary.ld-collapse-title {
      cursor: pointer;
    }

    .ld-collapse-title::-webkit-details-marker {
      display: none;
    }

    .ld-collapse-content {
      grid-row-start: 2;
      grid-column-start: 1;
      min-height: 0;
      padding-inline: 1rem;
      content-visibility: hidden;
    }

    .ld-collapse[data-open] > .ld-collapse-content,
    .ld-collapse[open] > .ld-collapse-content {
      min-height: fit-content;
      padding-bottom: 1rem;
      content-visibility: visible;
    }

    details.ld-collapse > .ld-collapse-content {
      content-visibility: visible;
    }

    @media (prefers-reduced-motion: no-preference) {
      .ld-collapse {
        transition: grid-template-rows 0.2s;
      }

      .ld-collapse-content {
        transition:
          content-visibility 0.2s allow-discrete,
          visibility 0.2s allow-discrete,
          min-height 0.2s ease-out allow-discrete,
          padding 0.1s ease-out 20ms;
      }

      details.ld-collapse::details-content {
        height: 0;
        interpolate-size: allow-keywords;
        transition:
          content-visibility 0.2s allow-discrete,
          visibility 0.2s allow-discrete,
          min-height 0.2s ease-out allow-discrete,
          padding 0.1s ease-out 20ms,
          height 0.2s;
      }

      details.ld-collapse[open]::details-content {
        height: auto;
      }
    }
  }
</style>
