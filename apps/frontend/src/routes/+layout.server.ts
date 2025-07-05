import type { ExposedConfig } from '$lib/domains/shared/exposed-config/domain/exposed-config.js';
import { logdashAPI } from '$lib/domains/shared/logdash.api.js';

export const load = async (): Promise<{
  exposedConfig: ExposedConfig;
}> => {
  const exposedConfig = await logdashAPI.get_exposed_config();

  return { exposedConfig };
};
