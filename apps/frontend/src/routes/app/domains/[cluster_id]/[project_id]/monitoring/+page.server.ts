import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
  redirect(308, `/app/domains/${params.cluster_id}/uptime`);
};
