import { logdashAPI } from '$lib/domains/shared/logdash.api.server';
import { get_access_token } from '$lib/domains/shared/utils/cookies.utils';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies, request, url }) => {
  const body = await request.json();
  const cluster = await logdashAPI.create_cluster(body.name, get_access_token(cookies));
  const { project: defaultProject } = await logdashAPI.create_project(
    'default',
    cluster.id,
    get_access_token(cookies),
  );

  return json({
    ...cluster,
    projects: [defaultProject],
  });
};
