import { Request } from 'express';
import { AccessRestriction } from '../../../personal-api-key/core/types/access-restriction.type';
import { ScopeEntry } from '../../../personal-api-key/core/types/scope-entry.type';

export interface RequestUser {
  id: string;
  scopes?: ScopeEntry[];
  access?: AccessRestriction;
  viaPersonalKey?: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: RequestUser;
}
