<!--
  The last thing on every page: a giant wordmark rising out of the page
  bottom.

  Two parts, one component:

  - `part="runway"`, rendered by Footer at the end of the page: 60vh of
    nothing but room, carrying the view timeline the floor listens to.
  - `part="floor"`, rendered once by the root layout behind the page: a
    fixed layer on the bottom edge of the window holding the wordmark and a
    soft light. It sits outside the page content on purpose. Overscroll
    (rubber-banding) then lifts the page off the floor instead of cutting the
    light, and the page-transition blur, a `filter` on the page content,
    can never re-anchor it.

  As the runway scrolls into view its timeline lifts the wordmark up from
  below the edge (0.88em: Inter's ascender height plus the floor plus a
  hair) and fades the light in, so the word climbs out of the page while
  the visitor keeps scrolling. Anywhere else the floor stays hidden.

  The wordmark stands on 0.12em of floor above the window edge: enough for
  the g's descender to show its curl before the tail runs off, so it still
  reads as a g. The line box is collapsed (`line-height: 0`) and a
  zero-height inline anchor sits on the baseline, so the column's bottom
  edge is the baseline itself, with no font-metric constants involved.

  Browsers without scroll-driven animations show a static copy of the layer
  inside the runway instead (the resting state, scrolling with the page).
-->
<script lang="ts">
  type Props = {
    part: 'runway' | 'floor';
  };
  const { part }: Props = $props();
</script>

{#snippet ending()}
  <div
    class="ld-ending-layer relative mx-auto flex h-[60vh] min-h-[24rem] w-full max-w-landing flex-col justify-end text-[min(26.5vw,23.5rem)] select-none"
  >
    <div class="ld-ending-light absolute inset-0"></div>
    <div
      class="ld-wordmark-line relative mx-auto w-full max-w-landing px-4 pb-[0.12em] sm:px-6 lg:px-10"
    >
      <span
        class="ld-wordmark font-semibold tracking-[-0.04em] whitespace-nowrap"
      >
        logdash
      </span>
    </div>
  </div>
{/snippet}

{#if part === 'runway'}
  <div
    class="ld-ending relative flex h-[60vh] min-h-[24rem] w-full flex-col justify-end overflow-clip"
    aria-hidden="true"
  >
    <div class="ld-ending-static w-full">
      {@render ending()}
    </div>
  </div>
{:else}
  <!--
    A fixed layer spans the viewport minus any classic scrollbar, the same
    width the page column is laid out in, so the wordmark column lines up with
    it whether scrollbars overlay or not.
  -->
  <div
    class="ld-ending-floor pointer-events-none fixed inset-x-0 bottom-0 z-0 overflow-hidden"
    aria-hidden="true"
  >
    {@render ending()}
  </div>
{/if}

<style>
  .ld-ending {
    view-timeline: --ld-ending block;
  }

  /* Solid greys only: the light runs from one neutral step up back to the page. */
  .ld-ending-light {
    background: radial-gradient(
      60% 85% at 50% 100%,
      var(--color-hairline),
      var(--color-base-300) 70%
    );
  }

  .ld-wordmark-line {
    line-height: 0;
  }

  /* Zero-height inline anchor: its bottom margin edge is the baseline. */
  .ld-wordmark-line::after {
    content: '';
    display: inline-block;
    height: 0;
  }

  .ld-wordmark {
    background: linear-gradient(
      to bottom,
      var(--color-neutral-700),
      var(--color-neutral-900)
    );
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  .ld-ending-floor {
    visibility: hidden;
  }

  @supports (timeline-scope: --ld-ending) {
    .ld-ending-static {
      display: none;
    }

    .ld-ending-floor,
    .ld-ending-floor .ld-ending-light,
    .ld-ending-floor .ld-wordmark-line {
      animation: ld-ending-show linear both;
      animation-timeline: --ld-ending;
      animation-range: entry 0% entry 100%;
    }

    .ld-ending-floor .ld-ending-light {
      animation-name: ld-ending-fade;
    }

    .ld-ending-floor .ld-wordmark-line {
      animation-name: ld-ending-rise;
    }

    @media (prefers-reduced-motion: reduce) {
      .ld-ending-floor .ld-wordmark-line {
        animation-name: ld-ending-fade;
      }
    }
  }

  @keyframes ld-ending-show {
    from {
      visibility: hidden;
    }
    to {
      visibility: visible;
    }
  }

  @keyframes ld-ending-fade {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes ld-ending-rise {
    from {
      transform: translateY(0.88em);
    }
    to {
      transform: none;
    }
  }
</style>
