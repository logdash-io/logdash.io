import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClusterTier } from '../enums/cluster-tier.enum';
import { ClusterFeature } from '../enums/cluster-feature.enum';

export class SimplifiedProject {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export class SimplifiedPublicDashboard {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  isPublic: boolean;
}

export class ClusterNormalized {
  id: string;
  name: string;
  members: string[];
  creatorId: string;
  tier: ClusterTier;
}

export class ClusterSerialized {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  members: string[];

  @ApiProperty()
  creatorId: string;

  @ApiProperty({ enum: ClusterTier })
  tier: ClusterTier;

  @ApiPropertyOptional({ type: SimplifiedProject, isArray: true })
  projects?: SimplifiedProject[];

  @ApiPropertyOptional({ enum: ClusterFeature, isArray: true })
  features?: ClusterFeature[];

  @ApiPropertyOptional({ type: SimplifiedPublicDashboard, isArray: true })
  publicDashboards?: SimplifiedPublicDashboard[];
}
