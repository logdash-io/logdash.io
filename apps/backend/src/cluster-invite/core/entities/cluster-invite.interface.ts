import { ApiProperty } from '@nestjs/swagger';

export interface ClusterInviteNormalized {
  id: string;
  inviterUserId: string;
  invitedUserId: string;
  clusterId: string;
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
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
