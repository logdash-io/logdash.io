import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsString } from 'class-validator';
import { ClusterRole } from '../../../cluster/core/enums/cluster-role.enum';

export class CreateClusterInviteBody {
  @ApiProperty()
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({ enum: [ClusterRole.Write, ClusterRole.Admin] })
  @IsIn([ClusterRole.Write, ClusterRole.Admin])
  role: ClusterRole;
}
