import { NodeHtmlMarkdown } from 'node-html-markdown';
import { NodeType, parse } from 'node-html-parser';
import { markdownPath } from './markdown-twin';
import { SITE_ORIGIN, sitemapEntries } from './seo-routes';

type Fetch = typeof fetch;

export type Twin = { path: string; markdown: string };

/**
 * Chrome, decoration and controls. `aria-hidden` is what screen readers skip
 * already. `data-nosnippet` is Google's "do not quote this", and marks the
 * live widgets and mock dashboards whose numbers are only placeholders.
 */
const NOT_CONTENT = [
  'footer',
  'script',
  'style',
  'noscript',
  'template',
  'svg',
  'canvas',
  'img',
  'picture',
  'video',
  'iframe',
  'button',
  'form',
  '[aria-hidden="true"]',
  '[data-nosnippet]',
].join(', ');

/** First path segment to llms.txt section, in the order they are listed. */
const SECTIONS: [title: string, segments: string[]][] = [
  ['Product', ['', 'features', 'pricing']],
  ['Docs', ['docs']],
  ['Comparisons', ['vs', 'alternatives']],
  ['Guides', ['health-check']],
  ['More', []],
  // llmstxt.org: an agent short on context may skip the Optional section.
  ['Optional', ['terms-of-service', 'privacy-policy', 'cookies-policy']],
];

const converter = new NodeHtmlMarkdown({ bulletMarker: '-' });

/**
 * The twin is converted from the rendered page rather than from its data, so
 * no page ships without one and a twin cannot drift from its page.
 */
export async function renderMarkdownTwin(
  fetch: Fetch,
  path: string,
): Promise<string> {
  const page = parse(await fetchText(fetch, path));
  const title = page.querySelector('title')?.text.trim() ?? path;
  const description =
    page
      .querySelector('meta[name="description"]')
      ?.getAttribute('content')
      ?.trim() ?? '';
  // Docs and SEO pages wrap their content in <main>, where a <nav> lists the
  // pages of a family. Everywhere else a <nav> is site chrome.
  const main = page.querySelector('main');
  const body = main ?? page.querySelector('body') ?? page;

  for (const node of body.querySelectorAll(
    main ? NOT_CONTENT : `${NOT_CONTENT}, nav`,
  )) {
    node.remove();
  }

  // svelte-highlight names the language on <pre>, the converter reads <code>.
  for (const pre of body.querySelectorAll('pre[data-language]')) {
    pre
      .querySelector('code')
      ?.setAttribute('class', `language-${pre.getAttribute('data-language')}`);
  }

  // A twin is read far away from the site, so its links carry the origin.
  for (const link of body.querySelectorAll('a[href^="/"]')) {
    link.setAttribute(
      'href',
      new URL(link.getAttribute('href') ?? '/', SITE_ORIGIN).href,
    );
  }

  // A card link wraps a title and a description. Linking only the title keeps
  // the whole card from turning into one long link text.
  for (const link of body.querySelectorAll('a')) {
    const [label, ...detail] = link
      .querySelectorAll('*')
      .filter(
        (node) =>
          node.childNodes.every(
            (child) => child.nodeType === NodeType.TEXT_NODE,
          ) && node.text.trim(),
      )
      .map((node) => node.rawText.trim());

    if (detail.length > 0) {
      link.set_content(label);
      link.replaceWith(`<p>${link.outerHTML}: ${detail.join(' ')}</p>`);
    }
  }

  // FAQ rows are <details>. As headings, each answer sits under its question.
  for (const summary of body.querySelectorAll('summary')) {
    summary.tagName = 'h3';
  }

  // Frontmatter values are JSON strings, which YAML reads as quoted scalars.
  return [
    '---',
    `title: ${JSON.stringify(title)}`,
    `description: ${JSON.stringify(description)}`,
    `url: ${new URL(path, SITE_ORIGIN).href}`,
    '---',
    '',
    converter.translate(body.innerHTML).trim(),
    '',
  ].join('\n');
}

/**
 * Twins are fetched by their `.md` URL, which makes the prerenderer write each
 * one to disk as well. Every link in llms.txt is therefore a file that exists.
 */
export function loadTwins(fetch: Fetch): Promise<Twin[]> {
  return Promise.all(
    sitemapEntries().map(async ({ path }) => ({
      path,
      markdown: await fetchText(fetch, markdownPath(path)),
    })),
  );
}

export function renderLlmsTxt(twins: Twin[]): string {
  const sections = SECTIONS.flatMap(([title]) => {
    const links = twins
      .filter((twin) => sectionOf(twin.path) === title)
      .map(linkLine);

    return links.length > 0 ? [`## ${title}\n\n${links.join('\n')}`] : [];
  });

  return `${[
    summary(twins),
    `Every link below is the markdown version of a page on ${SITE_ORIGIN}. All of them in one file: ${SITE_ORIGIN}/llms-full.txt`,
    ...sections,
  ].join('\n\n')}\n`;
}

export function renderLlmsFullTxt(twins: Twin[]): string {
  return [
    summary(twins),
    `Every page on ${SITE_ORIGIN} as markdown, in the order of ${SITE_ORIGIN}/llms.txt.`,
    ...twins.map((twin) => twin.markdown),
  ].join('\n\n');
}

/** The llms.txt header: the product name and the home page's description. */
function summary(twins: Twin[]): string {
  const home = twins.find((twin) => twin.path === '/');

  if (!home) {
    throw new Error(
      'llms.txt is summarised from the home page, add / to the sitemap.',
    );
  }

  return `# Logdash\n\n> ${frontmatter(home.markdown, 'description')}`;
}

function linkLine(twin: Twin): string {
  // Page titles end in " | Logdash" or " | Logdash Docs", noise in a list.
  const title = frontmatter(twin.markdown, 'title').replace(/\s\|\s[^|]*$/, '');
  const description = frontmatter(twin.markdown, 'description');

  return `- [${title}](${SITE_ORIGIN}${markdownPath(twin.path)}): ${description}`;
}

function sectionOf(path: string): string {
  const segment = path.split('/')[1];

  return (
    SECTIONS.find(([, segments]) => segments.includes(segment))?.[0] ?? 'More'
  );
}

/** Reads back a value renderMarkdownTwin wrote. */
function frontmatter(markdown: string, key: 'title' | 'description'): string {
  const value = markdown.match(new RegExp(`^${key}: (.*)$`, 'm'))?.[1];

  return value ? (JSON.parse(value) as string) : '';
}

async function fetchText(fetch: Fetch, path: string): Promise<string> {
  const response = await fetch(path);

  if (response.status !== 200) {
    throw new Error(
      `${path} answered ${response.status}. Every sitemap page needs a markdown twin, so its route must prerender: add \`export const prerender = true\`.`,
    );
  }

  return response.text();
}
