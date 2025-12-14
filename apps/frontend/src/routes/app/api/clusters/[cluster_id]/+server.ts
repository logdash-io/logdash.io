import { logdashAPI } from '$lib/domains/shared/logdash.api.server';
import { get_access_token } from '$lib/domains/shared/utils/cookies.utils';
import { json, type RequestHandler } from '@sveltejs/kit';

export const PUT: RequestHandler = async ({ cookies, params, request }) => {
  const body = await request.json();
  await logdashAPI.update_cluster(
    params.cluster_id,
    { name: body.name },
    get_access_token(cookies),
  );

  return json({
    status: 'ok',
  });
};

export const DELETE: RequestHandler = async ({ cookies, params }) => {
  await logdashAPI.delete_cluster(params.cluster_id, get_access_token(cookies));

  return json({
    status: 'ok',
  });
};
