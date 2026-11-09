import type {
  DocBlock,
  DocPage,
  DocsNavEntry,
} from '$lib/landing/guides/documentation.data';
import { match, P } from 'ts-pattern';

export type SearchEntry = {
  href: string;
  group: string;
  page: string;
  heading?: string;
  text: string;
};

export type SearchResult = SearchEntry & { snippet: string };

export type HighlightPart = { text: string; match: boolean };

const SNIPPET_LEAD = 40;
const SNIPPET_LENGTH = 160;

export function headingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function plainText(text: string): string {
  return text
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
}

export function buildSearchIndex(
  pages: DocPage[],
  nav: DocsNavEntry[],
): SearchEntry[] {
  return pages.flatMap((page) => {
    const entry = nav.find((candidate) => candidate.href === page.path);
    const base = {
      group: entry?.group ?? 'Docs',
      page: entry?.title ?? page.title,
    };
    const entries: SearchEntry[] = [
      {
        ...base,
        href: page.path,
        text: `${page.title}. ${page.description}`,
      },
    ];

    for (const block of page.blocks) {
      if (block.type === 'heading') {
        entries.push({
          ...base,
          href: `${page.path}#${headingId(block.text)}`,
          heading: block.text,
          text: '',
        });
        continue;
      }

      const text = blockText(block);
      const current = entries[entries.length - 1];

      if (text) {
        current.text = current.text ? `${current.text} ${text}` : text;
      }
    }

    return entries;
  });
}

function blockText(block: DocBlock): string {
  return plainText(
    match(block)
      .with({ type: P.union('paragraph', 'callout') }, ({ text }) => text)
      .with({ type: 'list' }, ({ items }) => items.join(' '))
      .with({ type: 'table' }, ({ headers, rows }) =>
        [headers, ...rows].flat().join(' '),
      )
      .with({ type: 'steps' }, ({ items }) =>
        items.map((step) => `${step.title}. ${step.text}`).join(' '),
      )
      .with({ type: 'faq' }, ({ items }) =>
        items.map((item) => `${item.question} ${item.answer}`).join(' '),
      )
      .with({ type: 'cards' }, ({ items }) =>
        items.map((card) => `${card.title}. ${card.description}`).join(' '),
      )
      .otherwise(() => ''),
  );
}

// ponytail: a linear scan over a few hundred sections, fine below a few thousand. Build an inverted index if the docs grow past that.
export function searchDocs(
  index: SearchEntry[],
  query: string,
  limit = 12,
): SearchResult[] {
  const terms = queryTerms(query);

  if (terms.length === 0) {
    return [];
  }

  const phrase = terms.join(' ');

  return index
    .map((entry, order) => ({
      entry,
      order,
      score: score(entry, terms, phrase),
    }))
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .slice(0, limit)
    .map(({ entry }) => ({ ...entry, snippet: snippet(entry.text, terms) }));
}

function score(entry: SearchEntry, terms: string[], phrase: string): number {
  const title = (entry.heading ?? entry.page).toLowerCase();
  const page = entry.page.toLowerCase();
  const text = entry.text.toLowerCase();
  let total = 0;

  for (const term of terms) {
    const inTitle = title.includes(term);
    const inPage = page.includes(term);
    const inText = text.includes(term);

    if (!inTitle && !inPage && !inText) {
      return 0;
    }

    if (inTitle) total += startsWord(title, term) ? 4 : 2;
    if (inPage) total += 1;
    if (inText) total += 1;
  }

  if (title.includes(phrase)) total += 4;
  if (title.startsWith(phrase)) total += 2;
  if (!entry.heading) total += 1;

  return total;
}

function snippet(text: string, terms: string[]): string {
  const lower = text.toLowerCase();
  const hit = Math.min(
    ...terms.map((term) => lower.indexOf(term)).filter((at) => at >= 0),
  );
  const at = Number.isFinite(hit) ? hit : 0;
  const start =
    at > SNIPPET_LEAD ? text.lastIndexOf(' ', at - SNIPPET_LEAD) + 1 : 0;
  const end = start + SNIPPET_LENGTH;
  const cut =
    end < text.length
      ? text.slice(start, text.lastIndexOf(' ', end))
      : text.slice(start);

  return `${start > 0 ? '…' : ''}${cut}${end < text.length ? '…' : ''}`;
}

export function highlight(text: string, query: string): HighlightPart[] {
  const terms = queryTerms(query);

  if (terms.length === 0) {
    return [{ text, match: false }];
  }

  const pattern = new RegExp(`(${terms.map(escapeRegExp).join('|')})`, 'gi');

  return text
    .split(pattern)
    .filter((part) => part !== '')
    .map((part) => ({ text: part, match: terms.includes(part.toLowerCase()) }));
}

function queryTerms(query: string): string[] {
  return [...new Set(query.toLowerCase().split(/\s+/).filter(Boolean))];
}

function startsWord(haystack: string, term: string): boolean {
  return new RegExp(`(^|[^a-z0-9])${escapeRegExp(term)}`).test(haystack);
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
