import { ApiProperty } from '@nestjs/swagger';
import { CustomDomainStatus } from '../enums/custom-domain-status.enum';

export class CustomDomainNormalized {
  id: string;
  domain: string;
  publicDashboardId: string;
  attemptCount: number;
  status: CustomDomainStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class CustomDomainSerialized {
  @ApiProperty()
  id: string;

  @ApiProperty()
  domain: string;

  @ApiProperty()
  publicDashboardId: string;

  @ApiProperty()
  attemptCount: number;

  @ApiProperty({ enum: CustomDomainStatus })
  status: CustomDomainStatus;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
