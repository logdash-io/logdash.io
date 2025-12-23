import { ProjectFeature } from '../../core/enums/project-feature.enum';
import { ProjectTier } from '../../core/enums/project-tier.enum';

export class CreateProjectDto {
  name: string;
  userId: string;
  clusterId: string;
  tier: ProjectTier;
  selectedFeatures?: ProjectFeature[];
}
