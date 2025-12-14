import { logdashAPI } from '$lib/domains/shared/logdash.api.server';
import { get_access_token } from '$lib/domains/shared/utils/cookies.utils';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ cookies, url }) => {
  const metricId = url.searchParams.get('metric_id');
  const projectId = url.searchParams.get('project_id');

  if (!metricId || !projectId) {
    return json({
      success: false,
      message: 'Missing query params: metric_id and/or project_id',
    });
  }

  await logdashAPI.delete_metric(
    url.searchParams.get('project_id'),
    url.searchParams.get('metric_id'),
    get_access_token(cookies),
  );

  return json({
    success: true,
    message: 'Metric deleted successfully',
  });
};
