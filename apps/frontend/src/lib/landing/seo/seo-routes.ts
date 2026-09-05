import { comparisons } from '$lib/landing/compare/compare.data';
import { docPages } from '$lib/landing/guides/documentation.data';
import { sdkDocs } from '$lib/landing/docs/sdk-docs.data';
import { alternatives } from './families/alternatives.data';
import { healthCheck } from './families/health-check.data';
import { pagePath, type SeoFamilyData } from './seo-page';

export type SitemapEntry = {
  /** Absolute path, no origin, no trailing slash except the root. */
  path: string;
  /** ISO date. Omitted for pages with no meaningful edit date. */
  lastmod?: string;
};

export const SITE_ORIGIN = 'https://logdash.io';

/**
 * Hand-maintained only for the handful of pages that are not generated from
 * a data file. Everything else derives from the same data the page renders
 * from, so a sitemap entry cannot drift from a route.
 *
 * Deliberately absent: `/demo-dashboard` (302s without a query),
 * `/use-cases` (noindex until it has content) and `/vs` (a redirect).
 */
const staticPaths: string[] = [
  '/',
  '/features/monitoring',
  '/features/logging',
  '/features/metrics',
  '/pricing',
  '/terms-of-service',
  '/privacy-policy',
  '/cookies-policy',
];

/**
 * Families land here as they ship, one line each. A plain array rather than a
 * register() call, so the sitemap cannot depend on which module happened to be
 * imported first.
 */
const families: SeoFamilyData[] = [alternatives, healthCheck];

export function familyRoutes(data: SeoFamilyData): SitemapEntry[] {
  return [
    { path: data.family.hubPath },
    ...data.pages.map((page) => ({
      path: pagePath(data.family, page),
      lastmod: page.updatedAt,
    })),
  ];
}

export function sitemapEntries(): SitemapEntry[] {
  const entries: SitemapEntry[] = [
    ...staticPaths.map((path) => ({ path })),
    ...Object.values(docPages).map((page) => ({ path: page.path })),
    { path: '/guides/sdk-migration' },
    { path: '/docs' },
    { path: '/docs/self-hosting' },
    ...sdkDocs.map((doc) => ({
      path: `/docs/${doc.slug}`,
      lastmod: doc.updatedAt,
    })),
    ...comparisons.map((comparison) => ({ path: `/vs/${comparison.slug}` })),
    ...families.flatMap(familyRoutes),
  ];

  return dedupe(entries);
}

function dedupe(entries: SitemapEntry[]): SitemapEntry[] {
  const seen = new Map<string, SitemapEntry>();

  for (const entry of entries) {
    if (!seen.has(entry.path)) {
      seen.set(entry.path, entry);
    }
  }

  return [...seen.values()];
}
