import { ClusterRole } from '../../../cluster/core/enums/cluster-role.enum';

export class CreateClusterInviteDto {
  inviterUserId: string;
  invitedUserId: string;
  invitedUserEmail: string;
  clusterId: string;
  role: ClusterRole;
}
