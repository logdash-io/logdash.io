import type {
  ClusterInvite,
  ClusterInviteCapacity,
} from '$lib/clusters/clusters/domain/cluster-invite';
import type {
  AcceptClusterInviteDto,
  CreateClusterInviteDto,
} from '$lib/clusters/clusters/domain/cluster-invite-dtos';
import { httpClient } from '$lib/shared/http';

export class ClusterInvitesService {
  static async createClusterInvite(
    clusterId: string,
    invite: CreateClusterInviteDto,
  ): Promise<ClusterInvite> {
    return httpClient.post<ClusterInvite>(
      `/clusters/${clusterId}/cluster_invites`,
      invite,
    );
  }

  static async getClusterInvites(clusterId: string): Promise<ClusterInvite[]> {
    return httpClient.get<ClusterInvite[]>(
      `/clusters/${clusterId}/cluster_invites`,
    );
  }

  static async getUserClusterInvites(): Promise<ClusterInvite[]> {
    return httpClient.get<ClusterInvite[]>('/users/me/cluster_invites');
  }

  static async acceptClusterInvite(
    inviteId: string,
    dto: AcceptClusterInviteDto = {},
  ): Promise<void> {
    return httpClient.put<void>(`/cluster_invites/${inviteId}/accept`, dto);
  }

  static async getClusterInviteCapacity(
    clusterId: string,
  ): Promise<ClusterInviteCapacity> {
    return httpClient.get<ClusterInviteCapacity>(
      `/clusters/${clusterId}/cluster_invites/capacity`,
    );
  }

  static async deleteClusterInvite(inviteId: string): Promise<void> {
    return httpClient.delete(`/cluster_invites/${inviteId}`);
  }

  static async deleteClusterRole(
    clusterId: string,
    userId: string,
  ): Promise<void> {
    return httpClient.delete(`/clusters/${clusterId}/roles/${userId}`);
  }
}
