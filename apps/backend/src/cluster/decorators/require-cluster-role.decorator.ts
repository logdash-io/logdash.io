import { SetMetadata } from '@nestjs/common';
import { ClusterRole } from '../core/enums/cluster-role.enum';

export const REQUIRE_ROLE_KEY = 'requireRole';

export const RequireRole = (...roles: ClusterRole[]) => SetMetadata(REQUIRE_ROLE_KEY, roles);
