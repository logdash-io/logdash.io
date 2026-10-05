import { useCases } from '$lib/landing/seo/families/use-cases.data';
import { error } from '@sveltejs/kit';
import type { EntryGenerator, PageLoad } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () => {
  return useCases.pages.map((page) => ({ slug: page.slug }));
};

export const load: PageLoad = ({ params }) => {
  const page = useCases.pages.find(
    (candidate) => candidate.slug === params.slug,
  );

  if (!page) {
    error(404, `No ${useCases.family.hubLabel} page for "${params.slug}".`);
  }

  return { page };
};
