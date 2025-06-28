import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateClusterInviteBody {
  @ApiProperty()
  @IsString()
  invitedUserId: string;
}
