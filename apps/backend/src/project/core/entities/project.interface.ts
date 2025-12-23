import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectTier } from '../enums/project-tier.enum';
import { ProjectFeature } from '../enums/project-feature.enum';
import { RateLimit } from '../../../shared/responses/rate-limit.response';

export class ProjectNormalized {
  id: string;
  name: string;
  clusterId: string;
  creatorId: string;
  members: string[];
  tier: ProjectTier;
  selectedFeatures: ProjectFeature[];
}

export class ProjectSerialized {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  clusterId: string;

  @ApiProperty()
  creatorId: string;

  @ApiProperty()
  members: string[];

  @ApiProperty({ enum: ProjectTier })
  tier: ProjectTier;

  @ApiPropertyOptional({ enum: ProjectFeature, isArray: true })
  features?: ProjectFeature[];

  @ApiPropertyOptional({ enum: ProjectFeature, isArray: true })
  selectedFeatures?: ProjectFeature[];

  @ApiPropertyOptional({ type: RateLimit, isArray: true })
  rateLimits?: RateLimit[];
}
