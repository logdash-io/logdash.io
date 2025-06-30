import { httpClient } from '$lib/shared/http/http-client.js';
import type { Cluster } from '../domain/cluster.js';

export class ClustersService {
  static async getClusters(): Promise<Cluster[]> {
    return httpClient.get<Cluster[]>('/users/me/clusters');
  }
}
