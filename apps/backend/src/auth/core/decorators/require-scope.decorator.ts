import { SetMetadata } from '@nestjs/common';
import { Action } from '../../../personal-api-key/core/enums/action.enum';
import { Resource } from '../../../personal-api-key/core/enums/resource.enum';

export const REQUIRE_SCOPE_KEY = 'requireScope';

export const RequireScope = (resource: Resource, action: Action) =>
  SetMetadata(REQUIRE_SCOPE_KEY, { resource, action });
