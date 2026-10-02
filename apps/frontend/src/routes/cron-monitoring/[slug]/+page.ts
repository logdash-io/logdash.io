import { cronMonitoring } from '$lib/landing/seo/families/cron-monitoring.data';
import { error } from '@sveltejs/kit';
import type { EntryGenerator, PageLoad } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () => {
  return cronMonitoring.pages.map((page) => ({ slug: page.slug }));
};

export const load: PageLoad = ({ params }) => {
  const page = cronMonitoring.pages.find(
    (candidate) => candidate.slug === params.slug,
  );

  if (!page) {
    error(
      404,
      `No ${cronMonitoring.family.hubLabel} page for "${params.slug}".`,
    );
  }

  return { page };
};
