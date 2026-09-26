import { Injectable } from '@nestjs/common';
import { ClusterFeature } from '../core/enums/cluster-feature.enum';

@Injectable()
export class ClusterFeaturesService {
  public getClusterFeaturesMany(clusterIds: string[]): Record<string, ClusterFeature[]> {
    return Object.fromEntries(clusterIds.map((clusterId) => [clusterId, []]));
  }
}
