<script lang="ts" generics="T extends string">
  import { press } from '@logdash/hyper-ui/utils/press';
  import { fromAction } from 'svelte/attachments';
  import { match } from 'ts-pattern';

  type Option = {
    value: T;
    label: string;
  };

  type Props = {
    options: Option[];
    /** `null` renders nothing selected - used where a choice must be explicit. */
    value: T | null;
    onChange: (value: T) => void;
    label: string;
    size?: 'sm' | 'xs';
  };

  let { options, value, onChange, label, size = 'sm' }: Props = $props();

  let buttons = $state<(HTMLButtonElement | undefined)[]>([]);
  let indicator = $state<{ x: number; width: number } | null>(null);
  let snap = $state(false);

  const activeIndex = $derived(
    options.findIndex((option) => option.value === value),
  );
  const tabStop = $derived(Math.max(activeIndex, 0));

  $effect(measure);

  function measure(): void {
    const button = buttons[activeIndex];
    indicator = button
      ? { x: button.offsetLeft, width: button.offsetWidth }
      : null;
  }

  function observeResize(track: HTMLDivElement): () => void {
    const observer = new ResizeObserver(remeasureWithoutMotion);
    observer.observe(track);
    for (const button of buttons) {
      if (button) {
        observer.observe(button);
      }
    }
    return () => observer.disconnect();
  }

  function remeasureWithoutMotion(): void {
    snap = true;
    measure();
    requestAnimationFrame(() => {
      snap = false;
    });
  }

  function select(next: T): void {
    if (next !== value) {
      onChange(next);
    }
  }

  function onKeydown(event: KeyboardEvent, index: number): void {
    const count = options.length;
    const next = match(event.key)
      .with('ArrowRight', 'ArrowDown', () => (index + 1) % count)
      .with('ArrowLeft', 'ArrowUp', () => (index - 1 + count) % count)
      .with('Home', () => 0)
      .with('End', () => count - 1)
      .otherwise(() => null);
    if (next === null) {
      return;
    }
    event.preventDefault();
    select(options[next].value);
    buttons[next]?.focus();
  }
</script>

<div
  class={['seg', { snap }]}
  data-size={size}
  role="radiogroup"
  aria-label={label}
  {@attach observeResize}
>
  {#if indicator}
    <span
      class="seg-indicator"
      aria-hidden="true"
      style:transform="translateX({indicator.x}px)"
      style:width="{indicator.width}px"
    ></span>
  {/if}

  {#each options as option, i (option.value)}
    <button
      bind:this={buttons[i]}
      type="button"
      class="seg-pill"
      role="radio"
      aria-checked={i === activeIndex}
      tabindex={i === tabStop ? 0 : -1}
      onclick={() => select(option.value)}
      onkeydown={(event) => onKeydown(event, i)}
      {@attach fromAction(press)}
    >
      {option.label}
    </button>
  {/each}
</div>

<style>
  .seg {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 2px;
    width: fit-content;
    padding: 2px;
    border-radius: 9px;
    background-color: var(--surface-50-bg);
    box-shadow: inset 0 0 0 1px var(--surface-50-border);
    isolation: isolate;
  }

  .seg-indicator {
    position: absolute;
    top: 2px;
    bottom: 2px;
    left: 0;
    z-index: -1;
    border-radius: 7px;
    background-color: var(--surface-150-bg);
    box-shadow:
      inset 0 0 0 0.5px var(--surface-150-border),
      0 1px 2px rgb(0 0 0 / 0.08);
    transition:
      transform 0.32s cubic-bezier(0.32, 0.72, 0, 1),
      width 0.32s cubic-bezier(0.32, 0.72, 0, 1);
  }

  .seg-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 28px;
    padding: 0 10px;
    border-radius: 7px;
    color: var(--fg-muted);
    font-size: 0.8125rem;
    font-weight: 500;
    line-height: 1.5;
    white-space: nowrap;
    cursor: pointer;
    transition: color 0.18s ease;
  }

  .seg[data-size='xs'] .seg-pill {
    height: 24px;
    padding: 0 8px;
    font-size: 0.78rem;
  }

  @media (hover: hover) {
    .seg-pill:hover {
      color: var(--fg-secondary);
    }
  }

  .seg-pill[aria-checked='true'] {
    color: var(--fg-default);
  }

  .seg-pill:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }

  .seg.snap .seg-indicator {
    transition: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .seg-indicator,
    .seg-pill {
      transition: none;
    }
  }
</style>
