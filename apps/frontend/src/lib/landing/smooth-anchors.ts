import { pushState } from '$app/navigation';
import { page } from '$app/state';
import type { Action } from 'svelte/action';
import { prefersReducedMotion } from '$lib/domains/shared/utils/scroll';

/**
 * Same-page anchor links (`href="#id"`) inside `node` scroll to their target
 * smoothly and push the hash onto the history, in place of the browser's
 * instant jump. `scroll-margin` on the target still applies.
 */
export const smoothAnchors: Action<HTMLElement> = (node) => {
  function onClick(event: MouseEvent): void {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>(
      'a[href^="#"]',
    );
    if (!anchor) return;
    const id = decodeURIComponent(anchor.hash.slice(1));
    const target = id ? document.getElementById(id) : null;
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({
      behavior: prefersReducedMotion() ? 'instant' : 'smooth',
    });
    // eslint-disable-next-line svelte/no-navigation-without-resolve -- same-page anchor
    pushState(anchor.hash, page.state);
  }

  node.addEventListener('click', onClick);
  return {
    destroy(): void {
      node.removeEventListener('click', onClick);
    },
  };
};
