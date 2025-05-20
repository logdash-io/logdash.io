import { ApiProperty } from '@nestjs/swagger';

export interface UserAddedToProjectEvent {
  userId: string;
  projectId: string;
}

export class UserAddedToProjectSerialized {
  @ApiProperty()
  projectId: string;
}
