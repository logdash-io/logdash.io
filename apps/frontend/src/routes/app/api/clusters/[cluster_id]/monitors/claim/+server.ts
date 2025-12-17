import { bffLogger } from '$lib/domains/shared/bff-logger.server.js';
import { logdashAPI } from '$lib/domains/shared/logdash.api.server.js';
import { get_access_token } from '$lib/domains/shared/utils/cookies.utils.js';
import { json, redirect, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params, url, cookies }) => {
  const monitorId = url.searchParams.get('monitor_id');
  const projectId = url.searchParams.get('project_id');

  if (!monitorId || !projectId) {
    return json({
      success: false,
      message: 'Missing query params: monitor_id and/or project_id',
    });
  }

  bffLogger.info(`Claiming monitor ${monitorId} for project ${projectId}`);

  await logdashAPI.claim_monitor(monitorId, get_access_token(cookies));

  redirect(303, `/app/clusters/${params.cluster_id}/${projectId}`);
};
