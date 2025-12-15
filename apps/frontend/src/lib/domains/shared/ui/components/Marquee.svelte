<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    children?: Snippet;
    pauseOnHover?: boolean;
    reverse?: boolean;
    vertical?: boolean;
    repeat?: number;
    duration?: string;
    gap?: string;
    className?: string;
    innerClassName?: string;
  };

  let {
    children,
    pauseOnHover = false,
    reverse = false,
    vertical = false,
    repeat = 4,
    duration = '40s',
    gap = '1rem',
    className = '',
    innerClassName = '',
  }: Props = $props();

  const repeats = $derived.by(() =>
    Array.from({ length: Math.max(1, repeat) }),
  );
</script>

<div
  class={[
    'marquee group flex overflow-hidden',
    className,
    {
      'marquee--vertical flex-col': vertical,
      'flex-row': !vertical,
      'marquee--pause-on-hover': pauseOnHover,
    },
  ]}
  style={`--marquee-duration: ${duration}; --marquee-gap: ${gap};`}
>
  {#each repeats as _, i}
    <div
      class={[
        'marquee__group flex shrink-0 items-stretch',
        innerClassName,
        {
          'flex-col': vertical,
          'flex-row': !vertical,
          'marquee__group--reverse': reverse,
        },
      ]}
      aria-hidden={i !== 0}
    >
      {@render children?.()}
    </div>
  {/each}
</div>

<style>
  .marquee {
    gap: var(--marquee-gap);
  }

  .marquee__group {
    gap: var(--marquee-gap);
    animation: marquee var(--marquee-duration) linear infinite;
  }

  .marquee--vertical .marquee__group {
    animation-name: marquee-vertical;
  }

  .marquee__group--reverse {
    animation-direction: reverse;
  }

  .marquee--pause-on-hover:hover .marquee__group {
    animation-play-state: paused;
  }

  @keyframes marquee {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(calc(-100% - var(--marquee-gap)));
    }
  }

  @keyframes marquee-vertical {
    from {
      transform: translateY(0);
    }
    to {
      transform: translateY(calc(-100% - var(--marquee-gap)));
    }
  }
</style>
