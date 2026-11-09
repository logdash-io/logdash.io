import { expect, test } from '@playwright/test';
import type { DocPage } from '$lib/landing/guides/documentation.data';
import {
  buildSearchIndex,
  headingId,
  highlight,
  plainText,
  searchDocs,
} from './docs-search';

const pages = [
  {
    path: '/docs/web-analytics',
    title: 'Add the web analytics tracker',
    description: 'Count visitors without cookies.',
    blocks: [
      { type: 'paragraph', text: 'Paste the snippet into the `<head>`.' },
      { type: 'heading', text: 'What the tracker sends' },
      {
        type: 'table',
        headers: ['Event', 'When'],
        rows: [['`pageview`', 'On load, see [Custom events](/docs/x).']],
      },
      { type: 'code', language: 'html', code: '<script defer></script>' },
    ],
  },
  {
    path: '/docs/web-analytics/proxy',
    title: 'Serve the tracker from your own domain',
    description: 'Ad blockers often block analytics from another domain.',
    blocks: [
      { type: 'heading', text: 'Add two routes' },
      { type: 'paragraph', text: 'A **proxy** forwards events to Logdash.' },
    ],
  },
] as unknown as DocPage[];

const nav = [
  {
    title: 'Add the tracker',
    href: '/docs/web-analytics',
    group: 'Web analytics',
  },
  {
    title: 'Serve it from your domain',
    href: '/docs/web-analytics/proxy',
    group: 'Web analytics',
  },
] as never;

const index = buildSearchIndex(pages, nav);

test('a page and each of its headings become entries with plain text', () => {
  expect(index.map((entry) => entry.href)).toEqual([
    '/docs/web-analytics',
    '/docs/web-analytics#what-the-tracker-sends',
    '/docs/web-analytics/proxy',
    '/docs/web-analytics/proxy#add-two-routes',
  ]);
  expect(index[0].text).toContain('Paste the snippet into the <head>.');
  expect(index[1]).toMatchObject({
    group: 'Web analytics',
    page: 'Add the tracker',
    heading: 'What the tracker sends',
    text: 'Event When pageview On load, see Custom events.',
  });
});

test('every query word has to match, and a heading outranks the text', () => {
  expect(searchDocs(index, 'tracker sends').map((hit) => hit.href)).toEqual([
    '/docs/web-analytics#what-the-tracker-sends',
  ]);
  expect(searchDocs(index, 'proxy')[0].href).toBe(
    '/docs/web-analytics/proxy#add-two-routes',
  );
  expect(searchDocs(index, 'routes')[0].heading).toBe('Add two routes');
  expect(searchDocs(index, 'nothing like this')).toEqual([]);
  expect(searchDocs(index, '   ')).toEqual([]);
});

test('a snippet starts near the first match', () => {
  const [hit] = searchDocs(
    [
      {
        href: '/docs',
        group: 'G',
        page: 'P',
        text: `${'word '.repeat(40)}needle and more`,
      },
    ],
    'needle',
  );

  expect(hit.snippet.startsWith('…')).toBe(true);
  expect(hit.snippet).toContain('needle and more');
});

test('highlight marks every query word, whatever its case', () => {
  expect(highlight('Tag your links, tag them all', 'TAG')).toEqual([
    { text: 'Tag', match: true },
    { text: ' your links, ', match: false },
    { text: 'tag', match: true },
    { text: ' them all', match: false },
  ]);
  expect(highlight('a+b (c)', '+b (c')).toEqual([
    { text: 'a', match: false },
    { text: '+b', match: true },
    { text: ' ', match: false },
    { text: '(c', match: true },
    { text: ')', match: false },
  ]);
});

test('heading ids and plain text', () => {
  expect(headingId('Serve it from your own domain')).toBe(
    'serve-it-from-your-own-domain',
  );
  expect(headingId('FAQ?')).toBe('faq');
  expect(
    plainText('Click **Save**, run `npm i` and read [the API](/docs/api).'),
  ).toBe('Click Save, run npm i and read the API.');
});
