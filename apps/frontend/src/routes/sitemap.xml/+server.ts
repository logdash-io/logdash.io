import {
  SITE_ORIGIN,
  sitemapEntries,
  type SitemapEntry,
} from '$lib/landing/seo/seo-routes';
import type { RequestHandler } from './$types';

/**
 * This used to be a hand-edited static/sitemap.xml and it drifted: pages
 * shipped without an entry, entries outlived their pages. Generating it from
 * the same data the routes render from means the two cannot disagree.
 *
 * Prerendered, so it still ships as a plain file on the CDN.
 */
export const prerender = true;

export const GET: RequestHandler = async () => {
  return new Response(renderSitemap(sitemapEntries()), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};

function renderSitemap(entries: SitemapEntry[]): string {
  const urls = entries.map(renderUrl).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

/**
 * No changefreq and no priority. Google ignores both, so they were only ever
 * a second set of numbers to keep in sync with nothing.
 */
function renderUrl(entry: SitemapEntry): string {
  const loc = escapeXml(`${SITE_ORIGIN}${normalisePath(entry.path)}`);
  const lastmod = entry.lastmod
    ? `\n    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`
    : '';

  return `  <url>
    <loc>${loc}</loc>${lastmod}
  </url>`;
}

/** The root keeps its slash, every other path loses a trailing one. */
function normalisePath(path: string): string {
  const trimmed = path.replace(/\/+$/, '');

  return trimmed === '' ? '/' : trimmed;
}

/** Family slugs are generated, so never trust a path to be XML-safe. */
function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}
