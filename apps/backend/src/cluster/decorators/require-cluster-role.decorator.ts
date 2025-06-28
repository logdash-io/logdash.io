import { SetMetadata } from '@nestjs/common';
import { ClusterRole } from '../core/enums/cluster-role.enum';

export const PERMITTED_CLUSTER_ROLES_KEY = 'permittedClusterRoles';

export const RequireOneOfClusterRoles = (...roles: ClusterRole[]) =>
  SetMetadata(PERMITTED_CLUSTER_ROLES_KEY, roles);
