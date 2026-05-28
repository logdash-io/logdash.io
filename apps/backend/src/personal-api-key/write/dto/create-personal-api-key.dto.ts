import { AccessRestriction } from '../../core/types/access-restriction.type';
import { ScopeEntry } from '../../core/types/scope-entry.type';

export class CreatePersonalApiKeyDto {
  userId: string;
  label: string;
  scopes: ScopeEntry[];
  access: AccessRestriction;
  expiresAt?: Date;
}
