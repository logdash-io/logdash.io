import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

export class ClusterInviteUtils {
  constructor(private readonly app: INestApplication) {}

  public async createClusterInvite(dto: {
    token: string;
    clusterId: string;
    invitedUserId: string;
  }): Promise<{
    id: string;
    inviterUserId: string;
    invitedUserId: string;
    clusterId: string;
    createdAt: string;
    updatedAt: string;
  }> {
    const response = await request(this.app.getHttpServer())
      .post(`/clusters/${dto.clusterId}/cluster_invites`)
      .set('Authorization', `Bearer ${dto.token}`)
      .send({
        invitedUserId: dto.invitedUserId,
      });

    return response.body;
  }

  public async acceptClusterInvite(dto: { token: string; inviteId: string }): Promise<void> {
    await request(this.app.getHttpServer())
      .patch(`/cluster_invites/${dto.inviteId}/accept`)
      .set('Authorization', `Bearer ${dto.token}`);
  }
}
