<script lang="ts" generics="T extends string">
  import { Badge } from '@logdash/hyper-ui/presentational';
  import { press } from '@logdash/hyper-ui/utils/press';
  import { flip } from 'svelte/animate';
  import { fromAction } from 'svelte/attachments';
  import { quintOut } from 'svelte/easing';
  import { prefersReducedMotion } from 'svelte/motion';
  import { match } from 'ts-pattern';
  import { dropOrder, slotLefts } from './drag-order';

  type Option = {
    value: T;
    label: string;
    badge?: string;
  };

  type Props = {
    options: Option[];
    /** `null` renders nothing selected - used where a choice must be explicit. */
    value: T | null;
    onChange: (value: T) => void;
    /** Lets the mouse drag the options into a new order. */
    onReorder?: (values: T[]) => void;
    label: string;
    size?: 'sm' | 'xs';
  };

  type Drag = {
    value: T;
    start: number;
    x: number;
    moved: boolean;
    left: number;
    lefts: number[];
    order: T[];
  };

  const DRAG_THRESHOLD = 4;

  let {
    options,
    value,
    onChange,
    onReorder,
    label,
    size = 'sm',
  }: Props = $props();

  let track = $state<HTMLDivElement>();
  let buttons = $state<(HTMLButtonElement | undefined)[]>([]);
  let indicator = $state<{ x: number; width: number } | null>(null);
  let snap = $state(false);
  let drag = $state.raw<Drag | null>(null);
  let held = $state.raw<{ order: T[]; options: Option[] } | null>(null);
  let dropped = false;

  const order = $derived(
    drag?.order ?? (held?.options === options ? held.order : null),
  );
  const shown = $derived(
    order
      ? order.flatMap((next) =>
          options.filter((option) => option.value === next),
        )
      : options,
  );
  const activeIndex = $derived(
    shown.findIndex((option) => option.value === value),
  );
  const tabStop = $derived(Math.max(activeIndex, 0));
  const lift = $derived(drag?.moved ? lifted(drag) : null);

  $effect(measure);

  function measure(): void {
    const button = buttons[activeIndex];
    indicator = button
      ? { x: button.offsetLeft, width: button.offsetWidth }
      : null;
  }

  function observeResize(node: HTMLDivElement): () => void {
    const observer = new ResizeObserver(onResize);
    observer.observe(node);
    for (const button of buttons) {
      if (button) {
        observer.observe(button);
      }
    }
    return () => observer.disconnect();
  }

  function onResize(): void {
    if (!drag) remeasureWithoutMotion();
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
    const count = shown.length;
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
    select(shown[next].value);
    buttons[next]?.focus();
  }

  function onClick(event: MouseEvent, next: T): void {
    if (dropped && event.detail) return;
    select(next);
  }

  function onPointerDown(event: PointerEvent, next: T): void {
    dropped = false;
    if (
      !onReorder ||
      !track ||
      event.button !== 0 ||
      event.pointerType === 'touch' ||
      shown.length < 2
    )
      return;
    const box = track.getBoundingClientRect();
    const rects = [...track.querySelectorAll('.seg-pill')].map((pill) =>
      pill.getBoundingClientRect(),
    );
    const index = shown.findIndex((option) => option.value === next);
    drag = {
      value: next,
      start: event.clientX,
      x: event.clientX,
      moved: false,
      left: rects[index].left - box.left,
      lefts: slotLefts(
        rects.flatMap((rect, at) => (at === index ? [] : [rect.width])),
        rects[0].left - box.left,
        rects[1].left - rects[0].right,
      ),
      order: shown.map((option) => option.value),
    };
  }

  function onWindowPointerMove(event: PointerEvent): void {
    if (
      !drag ||
      (!drag.moved && Math.abs(event.clientX - drag.start) < DRAG_THRESHOLD)
    )
      return;
    const next = { ...drag, x: event.clientX, moved: true };
    drag = {
      ...next,
      order: dropOrder(next.order, next.value, next.lefts, leftOf(next)),
    };
  }

  function onWindowPointerUp(): void {
    if (!drag) return;
    const { moved, order } = drag;
    drag = null;
    dropped = moved;
    if (!moved || order.every((one, at) => one === options[at]?.value)) return;
    held = { order, options };
    onReorder?.(order);
  }

  function onWindowPointerCancel(): void {
    drag = null;
  }

  function onWindowKeyDown(event: KeyboardEvent): void {
    if (!drag?.moved || event.key !== 'Escape') return;
    event.preventDefault();
    drag = null;
    dropped = true;
  }

  function leftOf({ left, start, x, lefts }: Drag): number {
    return Math.min(
      Math.max(left + x - start, lefts[0]),
      lefts[lefts.length - 1],
    );
  }

  function lifted(current: Drag): { value: T; left: number; offset: number } {
    const left = leftOf(current);
    const slot = current.lefts[current.order.indexOf(current.value)];
    return { value: current.value, left, offset: left - slot };
  }
</script>

<svelte:window
  onpointermove={onWindowPointerMove}
  onpointerup={onWindowPointerUp}
  onpointercancel={onWindowPointerCancel}
  onkeydown={onWindowKeyDown}
/>

<div
  bind:this={track}
  class={['seg', { snap: snap || lift?.value === value }]}
  data-size={size}
  role="radiogroup"
  aria-label={label}
  {@attach observeResize}
>
  {#if indicator}
    <span
      class="seg-indicator"
      aria-hidden="true"
      style:transform="translateX({lift?.value === value
        ? lift.left
        : indicator.x}px)"
      style:width="{indicator.width}px"
    ></span>
  {/if}

  {#each shown as option, i (option.value)}
    {@const lifting = lift?.value === option.value}
    <button
      bind:this={buttons[i]}
      type="button"
      class={['seg-pill', { lifted: lifting }]}
      role="radio"
      aria-checked={i === activeIndex}
      tabindex={i === tabStop ? 0 : -1}
      style:translate={lifting ? `${lift?.offset}px 0` : undefined}
      onclick={(event) => onClick(event, option.value)}
      onpointerdown={(event) => onPointerDown(event, option.value)}
      onkeydown={(event) => onKeydown(event, i)}
      animate:flip={{
        duration: lifting || prefersReducedMotion.current ? 0 : 320,
        easing: quintOut,
      }}
      {@attach fromAction(press)}
    >
      {option.label}
      {#if option.badge}
        <Badge size="xs">{option.badge}</Badge>
      {/if}
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
    gap: 6px;
    height: 28px;
    padding: 0 10px;
    border-radius: 7px;
    color: var(--fg-muted);
    font-size: 0.8125rem;
    font-weight: 500;
    line-height: 1.5;
    white-space: nowrap;
    cursor: pointer;
    user-select: none;
    transition:
      color 0.18s ease,
      translate 0.32s cubic-bezier(0.32, 0.72, 0, 1);
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

  .seg-pill.lifted {
    position: relative;
    z-index: 1;
    background-color: var(--surface-150-bg);
    box-shadow:
      inset 0 0 0 0.5px var(--surface-150-border),
      0 4px 12px rgb(0 0 0 / 0.32);
    cursor: grabbing;
    transition: color 0.18s ease;
  }

  .seg-pill.lifted[aria-checked='false'] {
    color: var(--fg-secondary);
    background-color: var(--surface-100-bg);
    box-shadow:
      inset 0 0 0 0.5px var(--surface-100-border),
      0 4px 12px rgb(0 0 0 / 0.32);
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
