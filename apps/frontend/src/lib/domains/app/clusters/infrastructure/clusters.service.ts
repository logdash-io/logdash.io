import { httpClient } from '$lib/domains/shared/http/http-client.js';
import type { Cluster } from '$lib/domains/app/clusters/domain/cluster.js';

export class ClustersService {
  static async getClusters(): Promise<Cluster[]> {
    return httpClient.get<Cluster[]>('/users/me/clusters');
  }
}
