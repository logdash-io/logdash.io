import { ProjectFeature } from '../../core/enums/project-feature.enum';

export class UpdateProjectDto {
  id: string;
  name?: string;
  creatorId?: string;
  clusterId?: string;
  selectedFeatures?: ProjectFeature[];
}
