import { logdashAPI } from '$lib/domains/shared/logdash.api.server.js';
import { get_access_token } from '$lib/domains/shared/utils/cookies.utils.js';
import { json, error, type RequestHandler } from '@sveltejs/kit';

export const PUT: RequestHandler = async ({ request, params, cookies }) => {
  const body = await request.json();
  try {
    const dashboard = await logdashAPI.update_public_dashboard(
      params.dashboard_id,
      body,
      get_access_token(cookies),
    );

    return json({
      success: true,
      data: dashboard,
    });
  } catch (e) {
    console.error('Failed to update public dashboard:', e);
    error(500, {
      message: 'Failed to update dashboard',
    });
  }
};
