import { logdashAPI } from '$lib/shared/logdash.api.js';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  try {
    const dashboardData = await logdashAPI.get_public_dashboard_public_data(
      params.public_dashboard_id,
    );

    return {
      dashboardId: params.public_dashboard_id,
      dashboardData,
    };
  } catch (err) {
    console.error('Failed to load public dashboard:', err);
    error(404, 'Dashboard not found');
  }
};
