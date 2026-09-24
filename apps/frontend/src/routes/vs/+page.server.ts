import { redirect } from '@sveltejs/kit';
import { comparisons } from '$lib/landing/compare/compare.data';
import type { PageServerLoad } from './$types';

/** The comparisons prerender, this bare redirect stays a real 302. */
export const prerender = false;

export const load: PageServerLoad = () => {
  const firstComparison = comparisons[0];
  redirect(302, `/vs/${firstComparison.slug}`);
};
