import { loadAllDocPages } from '$lib/landing/docs/docs-pages';
import { buildSearchIndex } from '$lib/landing/docs/docs-search';
import { docsNavEntries } from '$lib/landing/guides/documentation.data';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const prerender = true;

export const GET: RequestHandler = async () => {
  return json(buildSearchIndex(await loadAllDocPages(), docsNavEntries));
};
