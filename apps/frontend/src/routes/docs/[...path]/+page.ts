import { loadDocPage } from '$lib/landing/docs/docs-pages';
import { docsNavEntries } from '$lib/landing/guides/documentation.data';
import { error } from '@sveltejs/kit';
import type { EntryGenerator, PageLoad } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () => {
  return docsNavEntries.map((entry) => ({
    path: entry.href.slice('/docs/'.length),
  }));
};

export const load: PageLoad = async ({ params }) => {
  const path = params.path ? `/docs/${params.path}` : '/docs';
  const page = await loadDocPage(path);

  if (!page) {
    error(404, 'Not found');
  }

  return { page };
};
