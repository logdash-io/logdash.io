import type { ExposedConfig } from '$lib/domains/shared/exposed-config/domain/exposed-config.js';
import {
  buildDocSections,
  type DocSection,
} from '$lib/landing/guides/documentation.data.js';

export const load = async ({
  parent,
}): Promise<{
  docSections: DocSection[];
}> => {
  const { exposedConfig } = (await parent()) as {
    exposedConfig: ExposedConfig;
  };
  const docSections = buildDocSections(exposedConfig, 'monitoring');

  return { docSections };
};
