import { AccessRestriction } from '../../core/types/access-restriction.type';
import { ScopeEntry } from '../../core/types/scope-entry.type';

export interface PersonalApiKeyCreatedEvent {
  userId: string;
  label: string;
  prefix: string;
  scopes: ScopeEntry[];
  access: AccessRestriction;
  expiresAt?: Date;
}
