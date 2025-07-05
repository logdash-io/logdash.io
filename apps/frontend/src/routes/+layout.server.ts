import type { ExposedConfig } from '$lib/domains/shared/exposed-config/domain/exposed-config.js';
import { logdashAPI } from '$lib/domains/shared/logdash.api.js';
import { save_client_address } from '$lib/domains/shared/utils/cookies.utils.js';

export const load = async ({
  getClientAddress,
  cookies,
}): Promise<{
  exposedConfig: ExposedConfig;
}> => {
  const exposedConfig = await logdashAPI.get_exposed_config();
  save_client_address(cookies, btoa(getClientAddress()));

  return { exposedConfig };
};
