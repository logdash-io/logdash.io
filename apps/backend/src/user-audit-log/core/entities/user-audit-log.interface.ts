import { ApiProperty } from '@nestjs/swagger';

export class UserAuditLogNormalized {
  id: string;
  userId: string;
  actor: string;
  relatedDomain: string;
  description: string;
  createdAt: Date;
}

export class UserAuditLogSerialized {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  actor: string;

  @ApiProperty()
  relatedDomain: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  createdAt: Date;
}
