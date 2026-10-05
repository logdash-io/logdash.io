import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
  const { clusters } = await parent();

  if (clusters.length === 0) {
    redirect(302, '/app/domains/new');
  }
};
