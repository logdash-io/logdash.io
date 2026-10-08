import { httpClient } from '$lib/domains/shared/http/http-client.js';
import type {
  Cluster,
  ClusterPulse,
} from '$lib/domains/app/clusters/domain/cluster.js';

export interface CreateClusterDto {
  name: string;
  color?: string;
}

export interface UpdateClusterDto {
  name: string;
  color?: string;
}

export class ClustersService {
  static async getClusters(): Promise<Cluster[]> {
    return httpClient.get<Cluster[]>('/users/me/clusters');
  }

  static async getPulses(): Promise<ClusterPulse[]> {
    return httpClient.get<ClusterPulse[]>('/users/me/clusters/pulse');
  }

  static async createCluster(dto: CreateClusterDto): Promise<Cluster> {
    return httpClient.post<Cluster>('/users/me/clusters', dto);
  }

  static async updateCluster(
    id: string,
    dto: UpdateClusterDto,
  ): Promise<Cluster> {
    return httpClient.put<Cluster>(`/clusters/${id}`, dto);
  }

  static async deleteCluster(id: string): Promise<void> {
    await httpClient.delete<void>(`/clusters/${id}`);
  }
}
