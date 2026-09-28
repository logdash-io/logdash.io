import type { HLJSApi, Language } from 'highlight.js';
import bash from 'highlight.js/lib/languages/bash';
import type { LanguageType } from 'svelte-highlight/languages';

/**
 * highlight.js only colours shell builtins, strings and comments, so an
 * install line like `npx shadcn add <url>` comes out one flat grey. These
 * rules pick out what a reader scans for: the program and the URL or
 * package it fetches. The name stays `bash` so the markdown twins still
 * fence these blocks as bash.
 */
export const commandBash: LanguageType<'bash'> = {
  name: 'bash',
  register: (hljs: HLJSApi): Language => {
    const language = bash(hljs);

    language.contains = [
      { scope: 'string', match: /https?:\/\/[^\s'"]+/ },
      {
        // ponytail: a fixed verb list, covering every installer the docs show. Add a verb when a new one appears.
        match: [
          /\b(?:install|i|add|get|require)(?:[ \t]+package)?[ \t]+/,
          /[^\s'"-][^\s'"]*/,
        ],
        scope: { 2: 'string' },
      },
      {
        scope: 'built_in',
        match: /(?<=^[ \t]*|(?:&&|\|\||[|;])[ \t]*)[a-z][\w.-]*(?=[ \t]|$)/,
      },
      ...(language.contains ?? []),
    ];

    return language;
  },
};
