import { loadTwins, renderLlmsTxt } from '$lib/landing/seo/llms.server';
import type { RequestHandler } from './$types';

/** The llmstxt.org index, generated from the sitemap like sitemap.xml. */
export const prerender = true;

export const GET: RequestHandler = async ({ fetch }) => {
  return new Response(renderLlmsTxt(await loadTwins(fetch)), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
