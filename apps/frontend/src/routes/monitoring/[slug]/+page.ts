import { assets } from '$lib/landing/seo/families/monitoring.data';
import { error } from '@sveltejs/kit';
import type { EntryGenerator, PageLoad } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () => {
  return assets.pages.map((page) => ({ slug: page.slug }));
};

export const load: PageLoad = ({ params }) => {
  const page = assets.pages.find((candidate) => candidate.slug === params.slug);

  if (!page) {
    error(404, `No ${assets.family.hubLabel} page for "${params.slug}".`);
  }

  return { page };
};
