import { Action } from './enums/action.enum';
import { Resource } from './enums/resource.enum';
import { ScopeEntry } from './types/scope-entry.type';

/**
 * Every resource granted write access (which implies read). JWT (Session Token)
 * users are implicitly all-access and get this expanded scope array.
 */
export const ALL_ACCESS: ScopeEntry[] = Object.values(Resource).map((resource) => ({
  resource,
  action: Action.Write,
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
