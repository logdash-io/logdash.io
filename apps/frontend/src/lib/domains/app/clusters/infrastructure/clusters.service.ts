import { httpClient } from '$lib/domains/shared/http/http-client.js';
import type { Cluster } from '$lib/domains/app/clusters/domain/cluster.js';

export interface CreateClusterDto {
  name: string;
  color?: string;
}

export class ClustersService {
  static async getClusters(): Promise<Cluster[]> {
    return httpClient.get<Cluster[]>('/users/me/clusters');
  }

  static async createCluster(dto: CreateClusterDto): Promise<Cluster> {
    return httpClient.post<Cluster>('/users/me/clusters', dto);
  }
}
