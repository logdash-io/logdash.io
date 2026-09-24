import { logdashAPI } from '$lib/domains/shared/logdash.api.server';
import { get_access_token } from '$lib/domains/shared/utils/cookies.utils';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies, params, url }) => {
  const metricId = url.searchParams.get('metric_id');

  if (!metricId) {
    error(400, 'Missing query param: metric_id');
  }

  const metrics = await logdashAPI.get_metric_details(
    params.project_id,
    metricId,
    get_access_token(cookies),
  );

  return json({
    status: 200,
    data: metrics,
  });
};
