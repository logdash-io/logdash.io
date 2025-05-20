import { ClusterTier } from '../../core/enums/cluster-tier.enum';

export class CreateClusterDto {
  name: string;
  creatorId: string;
  members?: string[];
  tier: ClusterTier;
}
