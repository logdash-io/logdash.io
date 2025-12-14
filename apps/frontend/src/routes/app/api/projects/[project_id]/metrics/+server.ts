import { logdashAPI } from '$lib/domains/shared/logdash.api.server';
import { get_access_token } from '$lib/domains/shared/utils/cookies.utils';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies, params, url }) => {
  const logs = await logdashAPI.get_project_metrics(
    params.project_id,
    get_access_token(cookies),
  );

  return json({
    status: 200,
    data: logs,
  });
};
