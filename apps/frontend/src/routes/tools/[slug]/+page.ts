import { tools } from '$lib/landing/seo/families/tools.data';
import { error } from '@sveltejs/kit';
import type { EntryGenerator, PageLoad } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () => {
  return tools.pages.map((page) => ({ slug: page.slug }));
};

export const load: PageLoad = ({ params }) => {
  const page = tools.pages.find((candidate) => candidate.slug === params.slug);

  if (!page) {
    error(404, `No ${tools.family.hubLabel} page for "${params.slug}".`);
  }

  return { page };
};
