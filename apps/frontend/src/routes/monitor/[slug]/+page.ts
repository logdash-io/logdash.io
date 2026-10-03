import { platforms } from '$lib/landing/seo/families/monitor.data';
import { error } from '@sveltejs/kit';
import type { EntryGenerator, PageLoad } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () => {
  return platforms.pages.map((page) => ({ slug: page.slug }));
};

export const load: PageLoad = ({ params }) => {
  const page = platforms.pages.find(
    (candidate) => candidate.slug === params.slug,
  );

  if (!page) {
    error(404, `No ${platforms.family.hubLabel} page for "${params.slug}".`);
  }

  return { page };
};
