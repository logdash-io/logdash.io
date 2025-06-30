import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClusterRole } from '../../../cluster/core/enums/cluster-role.enum';

export class ClusterMember {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  role: ClusterRole;

  @ApiPropertyOptional()
  avatarUrl?: string;
}

export class ClusterInviteCapacityResponse {
  @ApiProperty()
  maxMembers: number;

  @ApiProperty()
  currentUsersCount: number;

  @ApiProperty()
  currentInvitesCount: number;

  @ApiProperty({ type: ClusterMember, isArray: true })
  members: ClusterMember[];
}
