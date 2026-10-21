import { building } from '$app/environment';
import type { ExposedConfig } from '$lib/domains/shared/exposed-config/domain/exposed-config.js';
import { logdashAPI } from '$lib/domains/shared/logdash.api.server.js';
import type { LayoutServerLoadEvent } from './$types';

// Prerendering runs this load for every page and markdown twin, hundreds of
// times. One fetch per build keeps a single network blip from failing it.
let prerenderedConfig: Promise<ExposedConfig> | undefined;

export const load = async ({
  url,
}: LayoutServerLoadEvent): Promise<{
  exposedConfig: ExposedConfig;
  origin: string;
}> => {
  const exposedConfig = await (building
    ? (prerenderedConfig ??= logdashAPI.get_exposed_config())
    : logdashAPI.get_exposed_config());

  return { exposedConfig, origin: url.origin };
};
