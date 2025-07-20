import { bffLogger } from '$lib/domains/shared/bff-logger.js';
import { logdashAPI } from '$lib/domains/shared/logdash.api.js';
import { get_access_token } from '$lib/domains/shared/utils/cookies.utils.js';
import { stripProtocol } from '$lib/domains/shared/utils/url.js';
import { json, redirect, type RequestHandler } from '@sveltejs/kit';
import { MonitorMode } from '$lib/domains/app/projects/domain/monitoring/monitor-mode.js';

export const GET: RequestHandler = async ({ params, url, cookies }) => {
  const monitorUrl = url.searchParams.get('url');
  const monitorName = url.searchParams.get('name');
  const mode =
    (url.searchParams.get('mode') as MonitorMode) || MonitorMode.PULL;
  const projectId = url.searchParams.get('project_id');

  if (!projectId) {
    return json({
      success: false,
      message: 'Missing query param: project_id',
    });
  }

  // Validation based on mode
  if (mode === MonitorMode.PULL) {
    if (!monitorUrl) {
      return json({
        success: false,
        message: 'Missing query param: url (required for pull mode)',
      });
    }
  } else if (mode === MonitorMode.PUSH) {
    if (!monitorName) {
      return json({
        success: false,
        message: 'Missing query param: name (required for push mode)',
      });
    }
  }

  const finalMonitorName = monitorName || stripProtocol(monitorUrl);
  const finalMonitorUrl = mode === MonitorMode.PULL ? monitorUrl : null;

  bffLogger.info(
    `Creating ${mode} monitor for project ${projectId} with name: ${finalMonitorName}${finalMonitorUrl ? ` and URL: ${finalMonitorUrl}` : ''}`,
  );

  await logdashAPI.create_monitor(
    projectId,
    {
      name: finalMonitorName,
      url: finalMonitorUrl,
      mode,
    },
    get_access_token(cookies),
  );

  redirect(303, `/app/clusters/${params.cluster_id}?project_id=${projectId}`);
};
