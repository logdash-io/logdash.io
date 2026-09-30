import { Action } from './enums/action.enum';
import { Resource } from './enums/resource.enum';
import { ScopeEntry } from './types/scope-entry.type';

/**
 * The highest level a key can hold on each resource. Raise an entry only when a
 * route is annotated at that level, so old keys never gain a permission by accident.
 */
export const MAX_GRANT: Record<Resource, Action> = {
  [Resource.Logs]: Action.Read,
  [Resource.Metrics]: Action.Read,
  [Resource.Monitors]: Action.Delete,
  [Resource.Projects]: Action.Read,
  [Resource.Clusters]: Action.Read,
  [Resource.Account]: Action.Read,
};

/**
 * Every resource at its MAX_GRANT. JWT (Session Token) users are implicitly
 * all-access and get this expanded scope array.
 */
export const ALL_ACCESS: ScopeEntry[] = Object.values(Resource).map((resource) => ({
  resource,
  action: MAX_GRANT[resource],
}));

/**
 * CLI default preset: logs/metrics/monitors/projects/clusters at read, everything
 * else implicitly `none` (absent from the array). Expanded at create time.
 */
export const CLI_DEFAULT: ScopeEntry[] = [
  Resource.Logs,
  Resource.Metrics,
  Resource.Monitors,
  Resource.Projects,
  Resource.Clusters,
].map((resource) => ({ resource, action: Action.Read }));
