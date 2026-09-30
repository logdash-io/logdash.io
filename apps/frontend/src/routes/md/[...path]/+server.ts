import { renderMarkdownTwin } from '$lib/landing/seo/llms.server';
import { sitemapEntries } from '$lib/landing/seo/seo-routes';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Serves `/pricing.md` and every other twin, rerouted here by src/hooks.ts.
 * Only ever prerendered: the build writes each twin as a static file.
 */
export const prerender = true;

export const GET: RequestHandler = async ({ fetch, params }) => {
  const path = `/${params.path}`;

  if (!sitemapEntries().some((entry) => entry.path === path)) {
    error(404, 'Not found');
  }

  return new Response(await renderMarkdownTwin(fetch, path), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
