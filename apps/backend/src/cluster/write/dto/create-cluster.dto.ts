import { ClusterRole } from '../../core/enums/cluster-role.enum';
import { ClusterTier } from '../../core/enums/cluster-tier.enum';

export class CreateClusterDto {
  name: string;
  creatorId: string;
  tier: ClusterTier;
  roles: Record<string, ClusterRole>;
  color?: string;
}
