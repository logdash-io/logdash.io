import { logdashAPI } from '$lib/domains/shared/logdash.api.server';
import { get_access_token } from '$lib/domains/shared/utils/cookies.utils';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies, params, url }) => {
  const metrics = await logdashAPI.get_metric_details(
    params.project_id,
    url.searchParams.get('metric_id'),
    get_access_token(cookies),
  );

  return json({
    status: 200,
    data: metrics,
  });
};
