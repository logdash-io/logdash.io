import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PublicDashboardSerialized } from '../../src/public-dashboard/core/entities/public-dashboard.interface';
import { PublicDashboardSerializer } from '../../src/public-dashboard/core/entities/public-dashboard.serializer';

export class PublicDashboardUtils {
  constructor(private readonly app: INestApplication<any>) {}

  public async createPublicDashboard(params: {
    clusterId: string;
    token: string;
    httpMonitorsIds?: string[];
  }): Promise<PublicDashboardSerialized> {
    const response = await request(this.app.getHttpServer())
      .post(`/clusters/${params.clusterId}/public-dashboards`)
      .set('Authorization', `Bearer ${params.token}`)
      .send({
        clusterId: params.clusterId,
        httpMonitorsIds: params.httpMonitorsIds,
      });

    return PublicDashboardSerializer.serialize(response.body);
  }
}
