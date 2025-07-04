import { ClusterRole } from '../../core/enums/cluster-role.enum';

export class UpdateClusterDto {
  id: string;
  name?: string;
  creatorId?: string;
  roles?: Record<string, ClusterRole>;
}
