import { ApiProperty } from '@nestjs/swagger';

export class ClusterInviteCapacityResponse {
  @ApiProperty()
  maxMembers: number;

  @ApiProperty()
  currentUsersCount: number;

  @ApiProperty()
  currentInvitesCount: number;
}
