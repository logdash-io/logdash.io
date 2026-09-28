import { expect, test } from '@playwright/test';
import hljs from 'highlight.js/lib/core';
import { commandBash } from './bash-grammar';

hljs.registerLanguage(commandBash.name, commandBash.register);

function tokens(code: string): [string, string][] {
  const html = hljs.highlight(code, { language: 'bash' }).value;

  return [...html.matchAll(/<span class="hljs-([\w_]+)">([^<]*)<\/span>/g)].map(
    ([, scope, text]) => [scope, text],
  );
}

test('an install line shows the program and what it fetches', () => {
  expect(
    tokens('npx shadcn add https://logdash.io/r/react/status-page.json'),
  ).toEqual([
    ['built_in', 'npx'],
    ['string', 'https://logdash.io/r/react/status-page.json'],
  ]);
  expect(tokens('npm install @logdash/node')).toEqual([
    ['built_in', 'npm'],
    ['string', '@logdash/node'],
  ]);
  expect(tokens('dotnet add package Logdash')).toEqual([
    ['built_in', 'dotnet'],
    ['string', 'Logdash'],
  ]);
});

test('a bare install does not reach onto the next line', () => {
  expect(tokens('pnpm install\ndocker compose up -d')).toEqual([
    ['built_in', 'pnpm'],
    ['built_in', 'docker'],
  ]);
});

test('chained commands and comments', () => {
  expect(
    tokens(
      '# ping on success\n* * * * * /srv/job && curl -fsS -X POST https://api.logdash.io/ping/1',
    ),
  ).toEqual([
    ['comment', '# ping on success'],
    ['built_in', 'curl'],
    ['string', 'https://api.logdash.io/ping/1'],
  ]);
});
