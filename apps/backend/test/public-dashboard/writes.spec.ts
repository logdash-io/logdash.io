import * as request from 'supertest';
import { createTestApp } from '../utils/bootstrap';
import { Types } from 'mongoose';

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

  describe('POST /clusters/:clusterId/public_dashboards', () => {
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
        .post(`/clusters/${clusterId}/public_dashboards`)
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
        .post(`/clusters/${setupA.cluster.id}/public_dashboards`)
        .set('Authorization', `Bearer ${setupA.token}`)
        .send({
          httpMonitorsIds: [httpMonitor.id],
        });

      // then
      expect(response.status).toEqual(400);
    });
  });

  describe('POST /public_dashboards/:publicDashboardId/monitors/:httpMonitorId', () => {
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
        .post(`/public_dashboards/${publicDashboard.id}/monitors/${httpMonitor.id}`)
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
        .post(`/public_dashboards/${publicDashboard.id}/monitors/${httpMonitor.id}`)
        .set('Authorization', `Bearer ${token}`);

      await request(bootstrap.app.getHttpServer())
        .post(`/public_dashboards/${publicDashboard.id}/monitors/${httpMonitor.id}`)
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
          `/public_dashboards/${publicDashboard.id}/monitors/${new Types.ObjectId().toString()}`,
        )
        .set('Authorization', `Bearer ${setupB.token}`);

      // then
      expect(response.status).toEqual(403);
    });
  });

  describe('DELETE /public_dashboards/:publicDashboardId/monitors/:httpMonitorId', () => {
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
        .delete(`/public_dashboards/${publicDashboard.id}/monitors/${httpMonitor.id}`)
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
        .delete(
          `/public_dashboards/${publicDashboard.id}/monitors/${new Types.ObjectId().toString()}`,
        )
        .set('Authorization', `Bearer ${setupB.token}`);

      // then
      expect(response.status).toEqual(403);
    });
  });

  describe('PUT /public_dashboards/:publicDashboardId', () => {
    it('updates public dashboard', async () => {
      // given
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();

      const publicDashboard = await bootstrap.utils.publicDashboardUtils.createPublicDashboard({
        clusterId: setup.cluster.id,
        token: setup.token,
        name: 'default name',
        isPublic: false,
      });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .put(`/public_dashboards/${publicDashboard.id}`)
        .set('Authorization', `Bearer ${setup.token}`)
        .send({
          name: 'changed name',
          isPublic: true,
        });

      // then
      const updatedDashboard = await bootstrap.models.publicDashboardModel.findById(
        publicDashboard.id,
      );

      expect(updatedDashboard?.name).toEqual('changed name');
      expect(updatedDashboard?.isPublic).toEqual(true);
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
        .put(`/public_dashboards/${publicDashboard.id}`)
        .set('Authorization', `Bearer ${setupB.token}`)
        .send({
          name: 'changed name',
          isPublic: true,
        });

      // then
      expect(response.status).toEqual(403);
    });
  });
});
