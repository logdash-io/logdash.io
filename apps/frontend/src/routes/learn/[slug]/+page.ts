import { learn } from '$lib/landing/seo/families/learn.data';
import { error } from '@sveltejs/kit';
import type { EntryGenerator, PageLoad } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () => {
  return learn.pages.map((page) => ({ slug: page.slug }));
};

export const load: PageLoad = ({ params }) => {
  const page = learn.pages.find((candidate) => candidate.slug === params.slug);

  if (!page) {
    error(404, `No ${learn.family.hubLabel} page for "${params.slug}".`);
  }

  return { page };
};
