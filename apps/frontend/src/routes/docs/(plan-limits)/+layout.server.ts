import {
  buildTablesFromConfig,
  type Table,
  type TableType,
} from '$lib/landing/guides/plan-limits';
import type { LayoutServerLoad } from './$types';

/** Plan limits are read from the API at build, like the home page's. */
export const prerender = true;

export const load: LayoutServerLoad = async ({
  parent,
}): Promise<{
  tables: Record<TableType, Table>;
}> => {
  const { exposedConfig } = await parent();

  return { tables: buildTablesFromConfig(exposedConfig) };
};
