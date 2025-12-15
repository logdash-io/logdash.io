import { logdashAPI } from '$lib/domains/shared/logdash.api.server.js';
import { get_access_token } from '$lib/domains/shared/utils/cookies.utils.js';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params, cookies }) => {
  try {
    const dashboards = await logdashAPI.get_public_dashboards(
      params.cluster_id,
      get_access_token(cookies),
    );

    return json({
      success: true,
      data: dashboards,
    });
  } catch (error) {
    console.error('Failed to get public dashboards:', error);
    return json(
      {
        success: false,
        error: 'Failed to load public dashboards',
      },
      { status: 500 },
    );
  }
};

export const POST: RequestHandler = async ({ params, cookies }) => {
  try {
    const dashboard = await logdashAPI.create_public_dashboard(
      params.cluster_id,
      get_access_token(cookies),
    );

    return json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    console.error('Failed to create public dashboard:', error);
    return json(
      {
        success: false,
        error: 'Failed to create public dashboard',
      },
      { status: 500 },
    );
  }
};
