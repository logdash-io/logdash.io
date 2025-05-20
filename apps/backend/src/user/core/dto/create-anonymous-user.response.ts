import { ApiProperty } from '@nestjs/swagger';
import { UserSerialized } from '../entities/user.interface';
import { ClusterSerialized } from '../../../cluster/core/entities/cluster.interface';

export class CreateAnonymousUserResponse {
  @ApiProperty({ type: UserSerialized })
  user: UserSerialized;

  @ApiProperty({ type: ClusterSerialized })
  cluster: ClusterSerialized;

  @ApiProperty()
  token: string;
}
