import type { ExposedConfig } from '$lib/domains/shared/exposed-config/domain/exposed-config.js';

export const load = async ({
  parent,
}): Promise<{
  exposedConfig: ExposedConfig;
}> => {
  const { exposedConfig } = (await parent()) as {
    exposedConfig: ExposedConfig;
  };

  return { exposedConfig };
};
