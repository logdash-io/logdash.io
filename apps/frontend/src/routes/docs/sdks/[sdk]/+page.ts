import { toDocPage } from '$lib/landing/docs/sdk-doc';
import { sdkDocs } from '$lib/landing/docs/sdk-docs.data';
import { error } from '@sveltejs/kit';
import type { EntryGenerator, PageLoad } from './$types';

/** Eight pages of static prose, baked at build time. */
export const prerender = true;

export const entries: EntryGenerator = () => {
  return sdkDocs.map((doc) => ({ sdk: doc.slug }));
};

export const load: PageLoad = ({ params }) => {
  const doc = sdkDocs.find((candidate) => candidate.slug === params.sdk);

  if (!doc) {
    error(404, `No SDK reference for "${params.sdk}".`);
  }

  // Resolved here so the component renders what it is handed and searches nothing.
  return { doc, page: toDocPage(doc) };
};
