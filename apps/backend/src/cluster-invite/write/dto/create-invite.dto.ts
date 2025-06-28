import { ClusterRole } from '../../../cluster/core/enums/cluster-role.enum';

export class CreateClusterInviteDto {
  inviterUserId: string;
  invitedUserId: string;
  clusterId: string;
  role: ClusterRole;
}
