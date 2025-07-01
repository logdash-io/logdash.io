import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ClusterEntity } from '../../src/cluster/core/entities/cluster.entity';
import { ClusterSerialized } from '../../src/cluster/core/entities/cluster.interface';
import { ClusterRole } from '../../src/cluster/core/enums/cluster-role.enum';
import { Model, Types } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';

export class ClusterUtils {
  private readonly clusterModel: Model<ClusterEntity>;

  constructor(private readonly app: INestApplication<any>) {
    this.clusterModel = app.get(getModelToken(ClusterEntity.name));
  }

  public async createProjectGroup(
    dto: Partial<ClusterEntity> & { token: string },
  ): Promise<ClusterSerialized> {
    if (!dto.name) {
      dto.name = 'My first project group';
    }

    const response = await request(this.app.getHttpServer())
      .post('/users/me/clusters')
      .set('Authorization', `Bearer ${dto.token}`)
      .send(dto);

    return response.body;
  }

  public async addRole(dto: {
    clusterId: string;
    userId: string;
    role: ClusterRole;
  }): Promise<void> {
    await this.clusterModel.updateOne(
      { _id: new Types.ObjectId(dto.clusterId) },
      { $set: { [`roles.${dto.userId}`]: dto.role } },
    );
  }
}
