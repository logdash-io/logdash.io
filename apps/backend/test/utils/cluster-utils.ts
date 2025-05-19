import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ClusterEntity } from '../../src/cluster/core/entities/cluster.entity';
import { ClusterSerialized } from '../../src/cluster/core/entities/cluster.interface';

export class ProjectGroupUtils {
  constructor(private readonly app: INestApplication<any>) {}

  public async createProjectGroup(
    dto: Partial<ClusterEntity> & { token: string },
  ): Promise<ClusterSerialized> {
    if (!dto.name) {
      dto.name = 'My first project group';
    }

    const response = await request(this.app.getHttpServer())
      .post('/users/me/project_groups')
      .set('Authorization', `Bearer ${dto.token}`)
      .send(dto);

    return response.body;
  }
}
