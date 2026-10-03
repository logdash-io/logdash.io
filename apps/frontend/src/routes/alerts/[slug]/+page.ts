import { alerts } from '$lib/landing/seo/families/alerts.data';
import { error } from '@sveltejs/kit';
import type { EntryGenerator, PageLoad } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () => {
  return alerts.pages.map((page) => ({ slug: page.slug }));
};

export const load: PageLoad = ({ params }) => {
  const page = alerts.pages.find((candidate) => candidate.slug === params.slug);

  if (!page) {
    error(404, `No ${alerts.family.hubLabel} page for "${params.slug}".`);
  }

  return { page };
};
