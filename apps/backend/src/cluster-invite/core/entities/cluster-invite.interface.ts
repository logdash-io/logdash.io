import { ApiProperty } from '@nestjs/swagger';
import { ClusterRole } from '../../../cluster/core/enums/cluster-role.enum';

export interface ClusterInviteNormalized {
  id: string;
  inviterUserId: string;
  invitedUserId: string;
  clusterId: string;
  role: ClusterRole;
  createdAt: Date;
  updatedAt: Date;
}

export class ClusterInviteSerialized {
  @ApiProperty()
  id: string;

  @ApiProperty()
  inviterUserId: string;

  @ApiProperty()
  invitedUserId: string;

  @ApiProperty()
  clusterId: string;

  @ApiProperty()
  role: ClusterRole;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
