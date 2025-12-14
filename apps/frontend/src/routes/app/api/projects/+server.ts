import { logdashAPI } from '$lib/domains/shared/logdash.api.server';
import { get_access_token } from '$lib/domains/shared/utils/cookies.utils';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies, request, url }) => {
  const clusterId = url.searchParams.get('cluster_id');
  const body = await request.json();
  const { project } = await logdashAPI.create_project(
    body.name,
    clusterId,
    get_access_token(cookies),
  );

  return json(project);
};
