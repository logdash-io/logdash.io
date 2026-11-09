import {
  docsNavEntries,
  type DocPage,
  type DocsPath,
} from '$lib/landing/guides/documentation.data';

const modules = import.meta.glob<{ page: DocPage }>('./pages/**/*.ts');

const SDK_PAGE = /^\/docs\/sdks\/([^/]+)$/;

const REPOSITORY_BLOB =
  'https://github.com/logdash-io/logdash.io/blob/main/apps/frontend/src/lib/landing/docs';

export async function loadDocPage(path: string): Promise<DocPage | undefined> {
  const load = modules[pageModule(path)];

  if (load) {
    return (await load()).page;
  }

  const slug = path.match(SDK_PAGE)?.[1];

  if (!slug) {
    return undefined;
  }

  const [{ sdkDocs }, { toDocPage }] = await Promise.all([
    import('./sdk-docs.data'),
    import('./sdk-doc'),
  ]);
  const doc = sdkDocs.find((candidate) => candidate.slug === slug);

  return doc && toDocPage(doc);
}

export async function loadAllDocPages(): Promise<DocPage[]> {
  const pages = await Promise.all(
    docsNavEntries.map((entry) => loadDocPage(entry.href)),
  );

  return pages.map((page, index) => {
    if (!page) {
      throw new Error(
        `${docsNavEntries[index].href} is in docsNav but has no page.`,
      );
    }

    return page;
  });
}

export function docSourceUrl(path: DocsPath): string {
  const file = modules[pageModule(path)]
    ? pageModule(path).slice(2)
    : 'sdk-docs.data.ts';

  return `${REPOSITORY_BLOB}/${file}`;
}

export function pageModule(path: string): string {
  return `./pages${path.slice('/docs'.length) || '/index'}.ts`;
}

export function pageModules(): string[] {
  return Object.keys(modules);
}
