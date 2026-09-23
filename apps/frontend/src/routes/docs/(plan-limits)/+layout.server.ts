import type { ExposedConfig } from '$lib/domains/shared/exposed-config/domain/exposed-config.js';
import {
  buildTablesFromConfig,
  type Table,
  type TableType,
} from '$lib/landing/guides/plan-limits';

export const load = async ({
  parent,
}): Promise<{
  tables: Record<TableType, Table>;
}> => {
  const { exposedConfig } = (await parent()) as {
    exposedConfig: ExposedConfig;
  };

  return { tables: buildTablesFromConfig(exposedConfig) };
};
