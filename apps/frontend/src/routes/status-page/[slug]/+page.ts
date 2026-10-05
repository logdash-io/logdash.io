import { statusPages } from '$lib/landing/seo/families/status-page.data';
import { error } from '@sveltejs/kit';
import type { EntryGenerator, PageLoad } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () => {
  return statusPages.pages.map((page) => ({ slug: page.slug }));
};

export const load: PageLoad = ({ params }) => {
  const page = statusPages.pages.find(
    (candidate) => candidate.slug === params.slug,
  );

  if (!page) {
    error(404, `No ${statusPages.family.hubLabel} page for "${params.slug}".`);
  }

  return { page };
};
