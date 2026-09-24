import { logdashAPI } from '$lib/domains/shared/logdash.api.server.js';
import { get_access_token } from '$lib/domains/shared/utils/cookies.utils.js';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ request, params, cookies }) => {
  const body = (await request.json()) as Partial<{
    name: string;
    isPublic: boolean;
  }>;
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
