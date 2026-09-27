import type { Pathname } from '$app/types';
import type {
  DocBlock,
  DocFaqItem,
} from '$lib/landing/guides/documentation.data';

/**
 * One family is one route, one data file and one hub. Pages are generated
 * from the data, never hand-written, so a family only ever costs a data file
 * plus the route pair that reads it.
 */
export type SeoFamilyKey =
  | 'alternatives'
  | 'cron-monitoring'
  | 'health-check'
  | 'monitor'
  | 'tools'
  | 'status-page'
  | 'learn'
  | 'monitoring'
  | 'alerts'
  | 'for';

/** The feature page each family points at. Exactly one link per page. */
export type FeaturePath =
  | '/features/monitoring'
  | '/features/logging'
  | '/features/metrics';

export type SeoFamily = {
  key: SeoFamilyKey;
  /** `/alternatives`, listing every page in the family. */
  hubPath: Extract<Pathname, `/${string}`>;
  /** Human label for the hub link at the bottom of every page. */
  hubLabel: string;
  title: string;
  description: string;
  /** One sentence under the hub H1. No intro paragraph. */
  intro: string;
  /**
   * Families whose hub itself targets a query (C "health check endpoint best
   * practices", D "cron job monitoring") carry article blocks. Other hubs are
   * plain lists.
   */
  hub?: {
    h1: string;
    answer: string;
    meta: { title: string; description: string };
    blocks: DocBlock[];
    faq?: DocFaqItem[];
  };
};

export type SeoPage = {
  slug: string;
  /** Equals the search phrasing, verbatim. */
  h1: string;
  /** First sentence under the H1, answering the query. No preamble. */
  answer: string;
  meta: { title: string; description: string };
  /** 500 to 900 words of body. */
  blocks: DocBlock[];
  featurePath: FeaturePath;
  /** 3 to 5, taken verbatim from the autocomplete variants. */
  faq: DocFaqItem[];
  /** ISO date, feeds sitemap lastmod. */
  updatedAt: string;
};

export type SeoFamilyData = {
  family: SeoFamily;
  pages: SeoPage[];
};

/**
 * The next three pages in array order, wrapping. Fixed order means the link
 * graph is stable between builds instead of reshuffling on every deploy.
 */
export function siblings(pages: SeoPage[], page: SeoPage): SeoPage[] {
  const index = pages.findIndex((candidate) => candidate.slug === page.slug);

  if (index === -1) {
    return pages.slice(0, 3);
  }

  return Array.from({ length: Math.min(3, pages.length - 1) }, (_, offset) => {
    return pages[(index + offset + 1) % pages.length];
  });
}

export function pagePath(family: SeoFamily, page: SeoPage): string {
  return `${family.hubPath}/${page.slug}`;
}

/** Rough word count of the rendered prose, used by the SEO e2e spec. */
export function wordCount(blocks: DocBlock[]): number {
  const text = blocks.flatMap(collectText).join(' ');

  return text.split(/\s+/).filter(Boolean).length;
}

function collectText(block: DocBlock): string[] {
  switch (block.type) {
    case 'paragraph':
    case 'heading':
      return [block.text];
    case 'list':
      return block.items;
    case 'faq':
      return block.items.flatMap((item) => [item.question, item.answer]);
    case 'steps':
      return block.items.flatMap((item) => [item.title, item.text]);
    case 'comparison':
      return block.rows.flatMap((row) => [row.feature, row.logdash, row.them]);
    case 'pick-them':
      return block.reasons;
    default:
      return [];
  }
}
