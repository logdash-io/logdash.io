import { cubicInOut, cubicOut, linear } from 'svelte/easing';
import { prefersReducedMotion } from 'svelte/motion';
import type { TransitionConfig } from 'svelte/transition';

/**
 * Page transitions, ported from simn.so.
 *
 * Every `PageView` on screen registers here with the function that derives its
 * key from a URL. On a fresh navigation the outermost view whose key changes
 * remounts and fades + un-blurs in (`pageIn`); views nested inside it are
 * created without an intro, and views outside it stay put. That is how the
 * docs sidebar survives a docs-to-docs navigation while only the article
 * column transitions.
 *
 * If the visitor was scrolled down, `takeover` first animates the document
 * back to the top while that same view blurs out, then hands the second half
 * of the arc to `pageIn`.
 */

export const BLUR_PX = 6;
const PAGE_IN_MS = 250;

/**
 * Sections whose layout keeps its own chrome (sidebar) mounted across
 * navigations inside the section. The root view keys on the section, the
 * section's `PageView` keys on the pathname.
 */
const SECTION_ROOTS = ['/docs', '/guides'];

export function sectionKey(url: URL): string {
  const section = SECTION_ROOTS.find(
    (root) => url.pathname === root || url.pathname.startsWith(`${root}/`),
  );
  return section ?? url.pathname;
}

export type PageViewHandle = {
  /** Outer views have a lower depth. */
  depth: number;
  keyOf: (url: URL) => string;
  element: () => HTMLElement | undefined;
};

type Takeover = { view: PageViewHandle; duration: number };

class PageTransitionState {
  private views: PageViewHandle[] = [];
  private takeover: Takeover | null = null;
  // `$state.raw`: views are compared by identity, so they must not be proxied.
  private arcView = $state.raw<PageViewHandle | null>(null);

  /** True while a takeover is carrying the scroll to the top. */
  get active(): boolean {
    return this.arcView !== null;
  }

  isArcView(view: PageViewHandle): boolean {
    return this.arcView === view;
  }

  register(view: PageViewHandle): () => void {
    this.views = [...this.views, view].sort((a, b) => a.depth - b.depth);
    return () => {
      this.views = this.views.filter((candidate) => candidate !== view);
    };
  }

  /** The outermost mounted view whose key differs between the two URLs. */
  changingView(from: URL, to: URL): PageViewHandle | undefined {
    return this.views.find((view) => view.keyOf(from) !== view.keyOf(to));
  }

  /**
   * Scrolls the document to the top over 250 to 700 ms (scaled by how far down
   * the visitor is) while the changing view blurs out. Resolves halfway so the
   * navigation can render the new page, which `pageIn` then fades in over the
   * remaining half. Returns nothing when there is nothing to animate.
   *
   * SvelteKit scrolls the window to the top as soon as the new page renders,
   * in the middle of the arc. With `scroll-behavior: smooth` on the root for
   * the duration that call starts a smooth scroll, which the next frame's
   * instant `scrollTo` takes over, instead of snapping to the top.
   */
  startTakeover(from: URL, to: URL): Promise<void> | undefined {
    if (prefersReducedMotion.current) return;
    const view = this.changingView(from, to);
    if (!view) return;
    const scrollTop = window.scrollY;
    if (scrollTop < 1) return;

    const duration = Math.max(250, Math.min(700, 200 + scrollTop / 5));
    const element = view.element();
    if (element) {
      element.style.filter = 'blur(0px)';
      element.style.opacity = '1';
    }
    this.takeover = { view, duration: duration / 2 };
    this.arcView = view;
    const root = document.documentElement;
    root.style.scrollBehavior = 'smooth';
    root.style.overflowAnchor = 'none';
    const start = performance.now();

    return new Promise<void>((resolve) => {
      const frame = (now: number): void => {
        const t = Math.min(1, (now - start) / duration);
        window.scrollTo({
          top: scrollTop * (1 - cubicInOut(t)),
          behavior: 'instant',
        });
        if (t < 0.5 && element) {
          const p = cubicInOut(t);
          element.style.filter = `blur(${BLUR_PX * Math.sin(Math.PI * p)}px)`;
          element.style.opacity = String(1 - 2 * p);
        } else {
          resolve();
        }
        if (t < 1) {
          requestAnimationFrame(frame);
        } else {
          this.arcView = null;
          root.style.scrollBehavior = '';
          root.style.overflowAnchor = '';
        }
      };
      requestAnimationFrame(frame);
    });
  }

  /** Drops a takeover that no view consumed, e.g. after leaving the landing. */
  reset(): void {
    this.takeover = null;
  }

  pageIn(view: PageViewHandle): TransitionConfig {
    if (prefersReducedMotion.current) return { duration: 0 };
    if (this.takeover?.view === view) {
      const { duration } = this.takeover;
      this.takeover = null;
      return {
        duration,
        easing: linear,
        css: (t) => {
          const p = cubicInOut(0.5 + t / 2);
          const q = (p - 0.5) * 2;
          return `opacity: ${0.3 + 0.7 * q}; filter: blur(${BLUR_PX * Math.sin(Math.PI * p)}px);`;
        },
      };
    }
    return {
      duration: PAGE_IN_MS,
      easing: cubicOut,
      css: (t) =>
        `opacity: ${0.3 + 0.7 * t}; filter: blur(${BLUR_PX * (1 - t)}px);`,
    };
  }
}

export const pageTransition = new PageTransitionState();
