import { Injectable } from '@nestjs/common';
import { ClusterFeature } from '../core/enums/cluster-feature.enum';

@Injectable()
export class ClusterFeaturesService {
  async getClusterFeatures(clusterId: string): Promise<ClusterFeature[]> {
    return [];
  }

  async getClusterFeaturesMany(
    clusterIds: string[],
  ): Promise<Record<string, ClusterFeature[]>> {
    const result: Record<string, ClusterFeature[]> = {};

    await Promise.all(
      clusterIds.map(async (clusterId) => {
        result[clusterId] = await this.getClusterFeatures(clusterId);
      }),
    );

    return result;
  }
}
