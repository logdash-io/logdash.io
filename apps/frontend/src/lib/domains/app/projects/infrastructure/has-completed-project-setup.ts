import { logdashAPI } from '$lib/domains/shared/logdash.api.server';

export const has_completed_project_setup = async (
  project_id: string,
  access_token: string,
): Promise<boolean> => {
  const hasLogs = await logdashAPI.get_project_logs(
    project_id,
    access_token,
    1,
  );
  // const hasMetrics = logdashAPI.get_log_metrics(project_id, "access_token");

  return hasLogs.length > 0;
};
