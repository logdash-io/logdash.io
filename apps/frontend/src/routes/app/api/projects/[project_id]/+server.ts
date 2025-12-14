import { logdashAPI } from '$lib/domains/shared/logdash.api.server';
import { get_access_token } from '$lib/domains/shared/utils/cookies.utils';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ cookies, request, params }) => {
  const body = await request.json();

  await logdashAPI.update_project(params.project_id, body, get_access_token(cookies));

  return json({
    status: 200,
  });
};

export const DELETE: RequestHandler = async ({ cookies, params, url }) => {
  await logdashAPI.delete_project(params.project_id, get_access_token(cookies));

  return json({
    success: true,
  });
};
