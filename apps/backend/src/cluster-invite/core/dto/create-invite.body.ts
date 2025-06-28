import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsIn, IsString } from 'class-validator';
import { ClusterRole } from '../../../cluster/core/enums/cluster-role.enum';

export class CreateClusterInviteBody {
  @ApiProperty()
  @IsString()
  invitedUserId: string;

  @ApiProperty({ enum: ClusterRole })
  @IsIn([ClusterRole.Write])
  role: ClusterRole;
}
