import * as request from 'supertest';
import { createTestApp } from '../utils/bootstrap';
import { PublicDashboardSerialized } from '../../src/public-dashboard/core/entities/public-dashboard.interface';
import { Types } from 'mongoose';
import { Type } from 'class-transformer';

describe('PublicDashboardCoreController (writes)', () => {
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    bootstrap = await createTestApp();
  });

  beforeEach(async () => {
    await bootstrap.methods.beforeEach();
  });

  afterAll(async () => {
    await bootstrap.methods.afterAll();
  });

  describe('POST /clusters/:clusterId/public-dashboards', () => {
    it('creates public dashboard', async () => {
      // given
      const { token, project, cluster } = await bootstrap.utils.generalUtils.setupAnonymous();
      const clusterId = cluster.id;

      const httpMonitor = await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
        token,
        projectId: project.id,
      });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .post(`/clusters/${clusterId}/public-dashboards`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          httpMonitorsIds: [httpMonitor.id],
        });

      // then
      const createdDashboard = await bootstrap.models.publicDashboardModel.findById(
        response.body.id,
      );

      expect(createdDashboard?.httpMonitorsIds).toContain(httpMonitor.id);
      expect(createdDashboard?.httpMonitorsIds).toHaveLength(1);
    });

    it('does not create public dashboard if http monitors do not belong to the same cluster', async () => {
      // given
      const setupA = await bootstrap.utils.generalUtils.setupAnonymous();
      const setupB = await bootstrap.utils.generalUtils.setupAnonymous();

      const httpMonitor = await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
        token: setupB.token,
        projectId: setupB.project.id,
      });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .post(`/clusters/${setupA.cluster.id}/public-dashboards`)
        .set('Authorization', `Bearer ${setupA.token}`)
        .send({
          httpMonitorsIds: [httpMonitor.id],
        });

      // then
      expect(response.status).toEqual(400);
    });
  });

  describe('POST /public-dashboards/:publicDashboardId/monitors/:httpMonitorId', () => {
    it('adds monitor to public dashboard', async () => {
      // given
      const { token, project, cluster } = await bootstrap.utils.generalUtils.setupAnonymous();
      const clusterId = cluster.id;

      const publicDashboard = await bootstrap.utils.publicDashboardUtils.createPublicDashboard({
        clusterId,
        token,
      });

      const httpMonitor = await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
        token,
        projectId: project.id,
      });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .post(`/public-dashboards/${publicDashboard.id}/monitors/${httpMonitor.id}`)
        .set('Authorization', `Bearer ${token}`);

      // then
      const updatedDashboard = await bootstrap.models.publicDashboardModel.findById(
        publicDashboard.id,
      );

      expect(updatedDashboard?.httpMonitorsIds).toContain(httpMonitor.id);
      expect(updatedDashboard?.httpMonitorsIds).toHaveLength(1);
    });

    it('does not add duplicate monitor to public dashboard', async () => {
      // given
      const { token, project, cluster } = await bootstrap.utils.generalUtils.setupAnonymous();
      const clusterId = cluster.id;

      const publicDashboard = await bootstrap.utils.publicDashboardUtils.createPublicDashboard({
        clusterId,
        token,
      });

      const httpMonitor = await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
        token,
        projectId: project.id,
      });

      // when
      await request(bootstrap.app.getHttpServer())
        .post(`/public-dashboards/${publicDashboard.id}/monitors/${httpMonitor.id}`)
        .set('Authorization', `Bearer ${token}`);

      await request(bootstrap.app.getHttpServer())
        .post(`/public-dashboards/${publicDashboard.id}/monitors/${httpMonitor.id}`)
        .set('Authorization', `Bearer ${token}`);

      // then
      const updatedDashboard = await bootstrap.models.publicDashboardModel.findById(
        publicDashboard.id,
      );

      expect(updatedDashboard?.httpMonitorsIds).toHaveLength(1);
    });

    it('throws 403 when user is not a member of the cluster', async () => {
      // given
      const setupA = await bootstrap.utils.generalUtils.setupAnonymous();
      const setupB = await bootstrap.utils.generalUtils.setupAnonymous();

      const publicDashboard = await bootstrap.utils.publicDashboardUtils.createPublicDashboard({
        clusterId: setupA.cluster.id,
        token: setupA.token,
      });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .post(
          `/public-dashboards/${publicDashboard.id}/monitors/${new Types.ObjectId().toString()}`,
        )
        .set('Authorization', `Bearer ${setupB.token}`);

      // then
      expect(response.status).toEqual(403);
    });
  });

  describe('DELETE /public-dashboards/:publicDashboardId/monitors/:httpMonitorId', () => {
    it('removes monitor from public dashboard', async () => {
      // given
      const { token, project, cluster } = await bootstrap.utils.generalUtils.setupAnonymous();
      const clusterId = cluster.id;

      const httpMonitor = await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
        token,
        projectId: project.id,
      });

      const publicDashboard = await bootstrap.utils.publicDashboardUtils.createPublicDashboard({
        clusterId,
        token,
        httpMonitorsIds: [httpMonitor.id],
      });

      const publicDashboardBeforeUpdates = await bootstrap.models.publicDashboardModel.findById(
        publicDashboard.id,
      );

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .delete(`/public-dashboards/${publicDashboard.id}/monitors/${httpMonitor.id}`)
        .set('Authorization', `Bearer ${token}`);

      // then
      const updatedDashboard = await bootstrap.models.publicDashboardModel.findById(
        publicDashboard.id,
      );

      expect(updatedDashboard?.httpMonitorsIds).toHaveLength(0);
      expect(updatedDashboard?.httpMonitorsIds).not.toContain(httpMonitor.id);
      expect(publicDashboardBeforeUpdates?.httpMonitorsIds).toContain(httpMonitor.id);
      expect(publicDashboardBeforeUpdates?.httpMonitorsIds).toHaveLength(1);
    });

    it('throws 403 when user is not a member of the cluster', async () => {
      // given
      const setupA = await bootstrap.utils.generalUtils.setupAnonymous();
      const setupB = await bootstrap.utils.generalUtils.setupAnonymous();

      const publicDashboard = await bootstrap.utils.publicDashboardUtils.createPublicDashboard({
        clusterId: setupA.cluster.id,
        token: setupA.token,
      });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .delete(`/public-dashboards/${publicDashboard.id}/monitors/asd123`)
        .set('Authorization', `Bearer ${setupB.token}`);

      // then
      expect(response.status).toEqual(403);
    });
  });
});
