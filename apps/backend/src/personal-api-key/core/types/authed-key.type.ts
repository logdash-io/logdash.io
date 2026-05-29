import { AccessRestriction } from './access-restriction.type';
import { ScopeEntry } from './scope-entry.type';

export interface AuthedKey {
  userId: string;
  scopes: ScopeEntry[];
  access: AccessRestriction;
}
