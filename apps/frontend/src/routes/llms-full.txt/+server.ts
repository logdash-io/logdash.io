import { loadTwins, renderLlmsFullTxt } from '$lib/landing/seo/llms.server';
import type { RequestHandler } from './$types';

/** Every markdown twin in one file, for agents that read the whole site. */
export const prerender = true;

export const GET: RequestHandler = async ({ fetch }) => {
  return new Response(renderLlmsFullTxt(await loadTwins(fetch)), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
