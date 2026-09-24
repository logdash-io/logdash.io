import { renderMarkdownTwin } from '$lib/landing/seo/llms.server';
import type { RequestHandler } from './$types';

/**
 * Serves `/pricing.md` and every other twin, rerouted here by src/hooks.ts.
 * Only ever prerendered: the build writes each twin as a static file.
 */
export const prerender = true;

export const GET: RequestHandler = async ({ fetch, params }) => {
  return new Response(await renderMarkdownTwin(fetch, `/${params.path}`), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
