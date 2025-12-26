import type { ExposedConfig } from '$lib/domains/shared/exposed-config/domain/exposed-config';
import {
  buildDocSections,
  type DocSection,
} from '$lib/landing/guides/documentation.data';

export const load = async ({
  parent,
}): Promise<{
  docSections: DocSection[];
}> => {
  const { exposedConfig } = (await parent()) as {
    exposedConfig: ExposedConfig;
  };
  const docSections = buildDocSections(exposedConfig, 'logging');

  return { docSections };
};
