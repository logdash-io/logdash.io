import { SetMetadata } from '@nestjs/common';

export const ALLOW_ANY_PERSONAL_KEY_KEY = 'allowAnyPersonalKey';

/**
 * Marks an endpoint as reachable by ANY authenticated personal API key,
 * regardless of its scopes (e.g. the whoami verify-and-identify probe).
 * `enforceScope` treats this as an unconditional pass for `ldp_` keys.
 */
export const AllowAnyPersonalKey = () => SetMetadata(ALLOW_ANY_PERSONAL_KEY_KEY, true);
