import {
  buildTablesFromConfig,
  type Table,
  type TableType,
} from '$lib/landing/guides/plan-limits';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({
  parent,
}): Promise<{
  tables: Record<TableType, Table>;
}> => {
  const { exposedConfig } = await parent();

  return { tables: buildTablesFromConfig(exposedConfig) };
};
