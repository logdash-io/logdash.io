import { healthCheck } from '$lib/landing/seo/families/health-check.data';
import { error } from '@sveltejs/kit';
import type { EntryGenerator, PageLoad } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () => {
  return healthCheck.pages.map((page) => ({ slug: page.slug }));
};

export const load: PageLoad = ({ params }) => {
  const page = healthCheck.pages.find(
    (candidate) => candidate.slug === params.slug,
  );

  if (!page) {
    error(404, `No ${healthCheck.family.hubLabel} page for "${params.slug}".`);
  }

  return { page };
};
