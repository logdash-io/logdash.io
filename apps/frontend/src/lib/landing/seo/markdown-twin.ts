/**
 * Every public page has a markdown twin for LLMs and coding agents at its URL
 * plus `.md`, and the root at `/index.html.md`, as llmstxt.org proposes.
 *
 * Kept apart from seo-routes.ts, which pulls in every page's data: this module
 * is imported by the universal reroute hook and by SeoMeta in the browser.
 */
const ROOT_TWIN = '/index.html.md';

/** The one endpoint that renders every twin, see routes/md/[...path]. */
const TWIN_ROUTE = '/md';

export function markdownPath(path: string): string {
  return path === '/' ? ROOT_TWIN : `${path}.md`;
}

/**
 * `/docs/sdks/python.md` would otherwise match `/docs/sdks/[sdk]`, so every
 * `.md` URL is rerouted to the twin endpoint before routing happens.
 */
export function markdownRoute(pathname: string): string | undefined {
  if (!pathname.endsWith('.md')) {
    return undefined;
  }

  const page = pathname === ROOT_TWIN ? '' : pathname.slice(0, -'.md'.length);

  return `${TWIN_ROUTE}${page}`;
}
