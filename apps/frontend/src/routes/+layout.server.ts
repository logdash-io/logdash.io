import type { ExposedConfig } from '$lib/domains/shared/exposed-config/domain/exposed-config.js';
import { logdashAPI } from '$lib/domains/shared/logdash.api.server.js';

export const load = async ({
  url,
}): Promise<{
  exposedConfig: ExposedConfig;
  origin: string;
}> => {
  const exposedConfig = await logdashAPI.get_exposed_config();

  return { exposedConfig, origin: url.origin };
};
