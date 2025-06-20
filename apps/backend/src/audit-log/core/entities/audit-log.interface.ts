import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuditLogNormalized {
  id: string;
  createdAt: Date;
  userId?: string;
  actor?: string;
  action?: string;
  relatedDomain?: string;
  description?: string;
  relatedEntityId?: string;
}

export class AuditLogSerialized {
  @ApiProperty()
  id: string;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  userId?: string;

  @ApiPropertyOptional()
  actor?: string;

  @ApiPropertyOptional()
  action?: string;

  @ApiPropertyOptional()
  relatedDomain?: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  relatedEntityId?: string;
}
