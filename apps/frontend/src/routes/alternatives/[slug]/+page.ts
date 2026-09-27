import { alternatives } from '$lib/landing/seo/families/alternatives.data';
import { error } from '@sveltejs/kit';
import type { EntryGenerator, PageLoad } from './$types';

/**
 * Every page is prose held in a data file, so the whole family is baked at
 * build time. Nothing here depends on the request, and search engines get
 * finished HTML rather than an empty shell.
 */
export const prerender = true;

export const entries: EntryGenerator = () => {
  return alternatives.pages.map((page) => ({ slug: page.slug }));
};

export const load: PageLoad = ({ params }) => {
  const page = alternatives.pages.find(
    (candidate) => candidate.slug === params.slug,
  );

  if (!page) {
    error(404, `No ${alternatives.family.hubLabel} page for "${params.slug}".`);
  }

  return { page };
};
