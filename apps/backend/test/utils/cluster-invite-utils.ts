import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ClusterRole } from '../../src/cluster/core/enums/cluster-role.enum';
import { ClusterInviteSerialized } from '../../src/cluster-invite/core/entities/cluster-invite.interface';
import { CreateClusterInviteBody } from '../../src/cluster-invite/core/dto/create-invite.body';

export class ClusterInviteUtils {
  constructor(private readonly app: INestApplication) {}

  public async createClusterInvite(dto: {
    token: string;
    clusterId: string;
    invitedUserEmail: string;
    role?: ClusterRole;
  }): Promise<ClusterInviteSerialized> {
    const body: CreateClusterInviteBody = {
      email: dto.invitedUserEmail,
      role: dto.role ?? ClusterRole.Write,
    };

    const response = await request(this.app.getHttpServer())
      .post(`/clusters/${dto.clusterId}/cluster_invites`)
      .set('Authorization', `Bearer ${dto.token}`)
      .send(body);

    return response.body;
  }

  public async acceptClusterInvite(dto: { token: string; inviteId: string }): Promise<void> {
    await request(this.app.getHttpServer())
      .patch(`/cluster_invites/${dto.inviteId}/accept`)
      .set('Authorization', `Bearer ${dto.token}`);
  }
}
