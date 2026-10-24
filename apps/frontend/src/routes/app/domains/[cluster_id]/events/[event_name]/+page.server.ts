import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params, url }) => {
  const search = new URLSearchParams(url.searchParams);
  search.set('event', params.event_name);
  redirect(308, `/app/domains/${params.cluster_id}?${search}`);
};
