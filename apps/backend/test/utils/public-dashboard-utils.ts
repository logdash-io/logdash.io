import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PublicDashboardSerialized } from '../../src/public-dashboard/core/entities/public-dashboard.interface';
import { PublicDashboardSerializer } from '../../src/public-dashboard/core/entities/public-dashboard.serializer';
import { UpdatePublicDashboardBody } from '../../src/public-dashboard/core/dto/update-public-dashboard.body';

export class PublicDashboardUtils {
  constructor(private readonly app: INestApplication<any>) {}

  public async createPublicDashboard(params: {
    clusterId: string;
    token: string;
    httpMonitorsIds?: string[];
    name?: string;
    isPublic?: boolean;
  }): Promise<PublicDashboardSerialized> {
    const response = await request(this.app.getHttpServer())
      .post(`/clusters/${params.clusterId}/public_dashboards`)
      .set('Authorization', `Bearer ${params.token}`)
      // The global ValidationPipe whitelists + forbids unknown properties, so the
      // body must contain exactly what `CreatePublicDashboardBody` declares. The
      // cluster id is a path parameter, not a body field.
      .send({
        ...(params.httpMonitorsIds ? { httpMonitorsIds: params.httpMonitorsIds } : {}),
        name: params.name || 'test',
        isPublic: params.isPublic === undefined ? true : params.isPublic,
      });

    return PublicDashboardSerializer.serialize(response.body);
  }

  public async updatePublicDashboard(
    params: UpdatePublicDashboardBody & { token: string; id: string },
  ): Promise<void> {
    const { token, id, ...body } = params;

    await request(this.app.getHttpServer())
      .put(`/public_dashboards/${id}`)
      .set('Authorization', `Bearer ${token}`)
      // `token`/`id` are transport details, not part of the body contract - the
      // whitelisting ValidationPipe rejects them.
      .send(body);
  }
}
