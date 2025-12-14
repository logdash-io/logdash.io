import { logdashAPI } from '$lib/domains/shared/logdash.api.server.js';
import { get_access_token } from '$lib/domains/shared/utils/cookies.utils.js';
import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ params, cookies }) => {
  try {
    const dashboard = await logdashAPI.add_http_monitor_to_public_dashboard(
      params.dashboard_id,
      params.monitor_id,
      get_access_token(cookies),
    );

    return json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    console.error('Failed to add monitor to public dashboard:', error);
    return json(
      {
        success: false,
        error: 'Failed to add monitor to dashboard',
      },
      { status: 500 },
    );
  }
};

export const DELETE: RequestHandler = async ({ params, cookies }) => {
  try {
    const dashboard =
      await logdashAPI.remove_http_monitor_from_public_dashboard(
        params.dashboard_id,
        params.monitor_id,
        get_access_token(cookies),
      );

    return json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    console.error('Failed to remove monitor from public dashboard:', error);
    return json(
      {
        success: false,
        error: 'Failed to remove monitor from dashboard',
      },
      { status: 500 },
    );
  }
};
