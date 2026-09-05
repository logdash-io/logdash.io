/**
 * Press feedback for buttons.
 *
 * A pressed control eases down to 97.5% of its size in 80 ms, stays there for
 * at least 90 ms so a quick tap still reads, then eases back over 150 ms. The
 * scale runs through the Web Animations API on the `scale` property, so it
 * composes with any `transform` or `translate` the element already carries.
 *
 * Two ways in:
 * - `use:press` on a single element.
 * - `installPressFeedback(document)` once per app, which covers every `.btn`
 *   beneath the root through event delegation.
 *
 * Does nothing under `prefers-reduced-motion: reduce`.
 */

const PRESS_SCALE = "0.975";
const PRESS_MS = 80;
const MIN_HOLD_MS = 90;
const RELEASE_MS = 150;
const EASING = "ease-out";
const PRESSABLE_SELECTOR = ".btn";
const INERT_SELECTOR = ':disabled, .btn-disabled, [aria-disabled="true"]';

type PressState = {
  pressedAt: number;
  down: Animation | null;
};

const states = new WeakMap<HTMLElement, PressState>();

function reducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function keyPresses(node: HTMLElement, key: string): boolean {
  if (key === "Enter") return true;
  // Space activates buttons but scrolls the page on links.
  return key === " " && node.tagName !== "A";
}

function pressableFrom(event: Event, selector: string): HTMLElement | null {
  if (!(event.target instanceof Element)) return null;
  const node = event.target.closest<HTMLElement>(selector);
  return node && !node.matches(INERT_SELECTOR) ? node : null;
}

export function pressDown(node: HTMLElement): void {
  if (typeof node.animate !== "function" || reducedMotion()) return;

  const state = states.get(node) ?? { pressedAt: 0, down: null };
  states.set(node, state);
  state.down?.cancel();
  state.pressedAt = performance.now();
  state.down = node.animate(
    { scale: PRESS_SCALE },
    { duration: PRESS_MS, easing: EASING, fill: "forwards" },
  );
}

export function pressRelease(node: HTMLElement): void {
  const state = states.get(node);
  if (!state || state.pressedAt === 0) return;

  const held = performance.now() - state.pressedAt;
  const down = state.down;
  state.pressedAt = 0;
  state.down = null;

  const up = node.animate(
    { scale: "1" },
    {
      duration: RELEASE_MS,
      delay: Math.max(0, MIN_HOLD_MS - held),
      easing: EASING,
      fill: "forwards",
    },
  );
  // Both animations end at the element's natural size, so dropping them once
  // the release lands changes nothing on screen and leaves no fill-forwards
  // animations behind.
  up.onfinish = () => {
    down?.cancel();
    up.cancel();
  };
}

/** Svelte action: `<button use:press>`. */
export function press(node: HTMLElement): { destroy: () => void } {
  const release = () => pressRelease(node);

  function onPointerDown(event: PointerEvent): void {
    if (event.button === 0) pressDown(node);
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (!event.repeat && keyPresses(node, event.key)) pressDown(node);
  }

  node.addEventListener("pointerdown", onPointerDown);
  node.addEventListener("pointerup", release);
  node.addEventListener("pointercancel", release);
  node.addEventListener("pointerleave", release);
  node.addEventListener("keydown", onKeyDown);
  node.addEventListener("keyup", release);
  node.addEventListener("blur", release);

  return {
    destroy() {
      release();
      node.removeEventListener("pointerdown", onPointerDown);
      node.removeEventListener("pointerup", release);
      node.removeEventListener("pointercancel", release);
      node.removeEventListener("pointerleave", release);
      node.removeEventListener("keydown", onKeyDown);
      node.removeEventListener("keyup", release);
      node.removeEventListener("blur", release);
    },
  };
}

/**
 * Presses every element matching `selector` under `root`, by delegation.
 * Returns a teardown function.
 */
export function installPressFeedback(
  root: EventTarget,
  selector: string = PRESSABLE_SELECTOR,
): () => void {
  let pressed: HTMLElement | null = null;

  function release(): void {
    if (!pressed) return;
    pressed.removeEventListener("pointerleave", release);
    pressRelease(pressed);
    pressed = null;
  }

  function down(node: HTMLElement): void {
    release();
    pressed = node;
    node.addEventListener("pointerleave", release);
    pressDown(node);
  }

  function onPointerDown(event: Event): void {
    if (!(event instanceof PointerEvent) || event.button !== 0) return;
    const node = pressableFrom(event, selector);
    if (node) down(node);
  }

  function onKeyDown(event: Event): void {
    if (!(event instanceof KeyboardEvent) || event.repeat) return;
    const node = pressableFrom(event, selector);
    if (node && keyPresses(node, event.key)) down(node);
  }

  function onFocusOut(event: Event): void {
    if (event.target === pressed) release();
  }

  root.addEventListener("pointerdown", onPointerDown);
  root.addEventListener("keydown", onKeyDown);
  root.addEventListener("keyup", release);
  root.addEventListener("focusout", onFocusOut);
  window.addEventListener("pointerup", release);
  window.addEventListener("pointercancel", release);
  window.addEventListener("blur", release);

  return () => {
    release();
    root.removeEventListener("pointerdown", onPointerDown);
    root.removeEventListener("keydown", onKeyDown);
    root.removeEventListener("keyup", release);
    root.removeEventListener("focusout", onFocusOut);
    window.removeEventListener("pointerup", release);
    window.removeEventListener("pointercancel", release);
    window.removeEventListener("blur", release);
  };
}
