import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsString } from 'class-validator';
import { ClusterRole } from '../../../cluster/core/enums/cluster-role.enum';

export class CreateClusterInviteBody {
  @ApiProperty()
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({ enum: ClusterRole })
  @IsIn([ClusterRole.Write])
  role: ClusterRole;
}
