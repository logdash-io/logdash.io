import request from 'supertest';
import { createTestApp } from '../utils/bootstrap';
import { HttpMonitorSerialized } from '../../src/http-monitor/core/entities/http-monitor.interface';
import { HttpPingSerialized } from '../../src/http-ping/core/entities/http-ping.interface';
import { UserTier } from '../../src/user/core/enum/user-tier.enum';
import nock from 'nock';

describe('Monitors owned by the domain', () => {
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    bootstrap = await createTestApp();
  });

  beforeEach(async () => {
    await bootstrap.methods.beforeEach();
    nock('https://api.telegram.org')
      .persist()
      .post(/^\/bot[^/]+\/sendMessage/)
      .query(true)
      .reply(200, { ok: true, result: { message_id: 1 } });
    nock('https://example.com').persist().post(/.*/).reply(200);
  });

  afterAll(async () => {
    nock.cleanAll();
    await bootstrap.methods.afterAll();
  });

  describe('status pages', () => {
    it('creates a private status page that takes new monitors when a domain is created', async () => {
      // given
      const { token } = await bootstrap.utils.generalUtils.setupClaimed();

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .post('/users/me/clusters')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'acme.com' });

      // then
      expect(response.status).toBe(201);
      expect(
        await bootstrap.models.publicDashboardModel
          .findOne({ clusterId: (response.body as { id: string }).id })
          .lean(),
      ).toMatchObject({
        name: 'acme.com',
        isPublic: false,
        autoAddMonitors: true,
        httpMonitorsIds: [],
      });
    });

    it('creates the default status page for an anonymous domain', async () => {
      // when
      const { cluster } = await bootstrap.utils.generalUtils.setupAnonymous({
        keepDefaultStatusPage: true,
      });

      // then
      expect(
        await bootstrap.models.publicDashboardModel.countDocuments({ clusterId: cluster.id }),
      ).toBe(1);
    });

    it('adds a claimed monitor only to status pages that take new monitors', async () => {
      // given
      const { token, cluster } = await bootstrap.utils.generalUtils.setupAnonymous({
        userTier: UserTier.Pro,
        keepDefaultStatusPage: true,
      });
      const curated = await bootstrap.utils.publicDashboardUtils.createPublicDashboard({
        clusterId: cluster.id,
        token,
      });
      await bootstrap.utils.publicDashboardUtils.updatePublicDashboard({
        id: curated.id,
        token,
        autoAddMonitors: false,
      });

      // when
      const monitor = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
        token,
        clusterId: cluster.id,
      });

      // then
      const dashboards = await bootstrap.models.publicDashboardModel
        .find({ clusterId: cluster.id })
        .lean();
      expect(dashboards.find((dashboard) => dashboard.autoAddMonitors)?.httpMonitorsIds).toEqual([
        monitor.id,
      ]);
      expect(
        dashboards.find((dashboard) => dashboard._id.toString() === curated.id)?.httpMonitorsIds,
      ).toEqual([]);
    });

    it('removes a deleted monitor from every status page', async () => {
      // given
      const { token, cluster } = await bootstrap.utils.generalUtils.setupAnonymous({
        keepDefaultStatusPage: true,
      });
      const monitor = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
        token,
        clusterId: cluster.id,
      });

      // when
      await request(bootstrap.app.getHttpServer())
        .delete(`/http_monitors/${monitor.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // then
      expect(
        await bootstrap.models.publicDashboardModel.findOne({ clusterId: cluster.id }).lean(),
      ).toMatchObject({ httpMonitorsIds: [] });
    });
  });

  describe('alerts', () => {
    it('sends a claimed monitor to every alert channel of the domain', async () => {
      // given
      const { token, cluster } = await bootstrap.utils.generalUtils.setupAnonymous();
      const channelA =
        await bootstrap.utils.notificationChannelUtils.createWebhookNotificationChannel({
          clusterId: cluster.id,
          token,
          options: { url: 'https://example.com/a' },
        });
      const channelB =
        await bootstrap.utils.notificationChannelUtils.createWebhookNotificationChannel({
          clusterId: cluster.id,
          token,
          options: { url: 'https://example.com/b' },
        });

      // when
      const monitor = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
        token,
        clusterId: cluster.id,
      });

      // then
      const entity = await bootstrap.models.httpMonitorModel.findById(monitor.id).lean();
      expect(entity?.notificationChannelsIds.sort()).toEqual([channelA.id, channelB.id].sort());
    });

    it('turns a new alert channel on for every claimed monitor of the domain', async () => {
      // given
      const setupA = await bootstrap.utils.generalUtils.setupAnonymous();
      const setupB = await bootstrap.utils.generalUtils.setupAnonymous();
      const monitorA = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
        token: setupA.token,
        clusterId: setupA.cluster.id,
      });
      const monitorB = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
        token: setupB.token,
        clusterId: setupB.cluster.id,
      });

      // when
      const channel =
        await bootstrap.utils.notificationChannelUtils.createWebhookNotificationChannel({
          clusterId: setupA.cluster.id,
          token: setupA.token,
          options: { url: 'https://example.com' },
        });

      // then
      expect(await bootstrap.models.httpMonitorModel.findById(monitorA.id).lean()).toMatchObject({
        notificationChannelsIds: [channel.id],
      });
      expect(await bootstrap.models.httpMonitorModel.findById(monitorB.id).lean()).toMatchObject({
        notificationChannelsIds: [],
      });
    });

    it('takes a deleted alert channel off every monitor', async () => {
      // given
      const { token, cluster } = await bootstrap.utils.generalUtils.setupAnonymous();
      const monitor = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
        token,
        clusterId: cluster.id,
      });
      const channel =
        await bootstrap.utils.notificationChannelUtils.createWebhookNotificationChannel({
          clusterId: cluster.id,
          token,
          options: { url: 'https://example.com' },
        });

      // when
      await request(bootstrap.app.getHttpServer())
        .delete(`/notification_channels/${channel.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // then
      expect(await bootstrap.models.httpMonitorModel.findById(monitor.id).lean()).toMatchObject({
        notificationChannelsIds: [],
      });
    });
  });

  describe('removal', () => {
    it('keeps the monitors of a deleted service on the domain', async () => {
      // given
      const { token, project, cluster } = await bootstrap.utils.generalUtils.setupAnonymous();
      const monitor = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
        token,
        projectId: project.id,
      });

      // when
      await request(bootstrap.app.getHttpServer())
        .delete(`/projects/${project.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // then
      const entity = await bootstrap.models.httpMonitorModel.findById(monitor.id).lean();
      expect(entity).toMatchObject({ clusterId: cluster.id });
      expect(entity?.projectId).toBeUndefined();
    });

    it('deletes the monitors of a deleted domain', async () => {
      // given
      const { token, cluster } = await bootstrap.utils.generalUtils.setupAnonymous();
      await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
        token,
        clusterId: cluster.id,
      });

      // when
      await request(bootstrap.app.getHttpServer())
        .delete(`/clusters/${cluster.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // then
      expect(
        await bootstrap.models.httpMonitorModel.countDocuments({ clusterId: cluster.id }),
      ).toBe(0);
    });
  });

  describe('GET /clusters/:clusterId/http_monitors', () => {
    it('reads monitors that belong to no service', async () => {
      // given
      const setupA = await bootstrap.utils.generalUtils.setupAnonymous();
      const setupB = await bootstrap.utils.generalUtils.setupAnonymous();
      const monitor = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
        token: setupA.token,
        clusterId: setupA.cluster.id,
      });
      await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
        token: setupB.token,
        clusterId: setupB.cluster.id,
      });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/clusters/${setupA.cluster.id}/http_monitors`)
        .set('Authorization', `Bearer ${setupA.token}`);

      // then
      expect(response.status).toBe(200);
      expect((response.body as HttpMonitorSerialized[]).map((item) => item.id)).toEqual([
        monitor.id,
      ]);
    });
  });

  describe('GET /clusters/:clusterId/monitors/:monitorId/http_pings', () => {
    it('reads pings of a domain monitor', async () => {
      // given
      const { token, cluster } = await bootstrap.utils.generalUtils.setupAnonymous();
      const monitor = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
        token,
        clusterId: cluster.id,
      });
      await bootstrap.utils.httpPingUtils.createHttpPing({ httpMonitorId: monitor.id });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/clusters/${cluster.id}/monitors/${monitor.id}/http_pings`)
        .set('Authorization', `Bearer ${token}`);

      // then
      expect(response.status).toBe(200);
      expect((response.body as HttpPingSerialized[]).length).toBe(1);
    });

    it('hides a monitor of another domain', async () => {
      // given
      const setupA = await bootstrap.utils.generalUtils.setupAnonymous();
      const setupB = await bootstrap.utils.generalUtils.setupAnonymous();
      const monitorB = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
        token: setupB.token,
        clusterId: setupB.cluster.id,
      });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/clusters/${setupA.cluster.id}/monitors/${monitorB.id}/http_pings`)
        .set('Authorization', `Bearer ${setupA.token}`);

      // then
      expect(response.status).toBe(404);
    });

    it('denies access for non-cluster member', async () => {
      // given
      const setupA = await bootstrap.utils.generalUtils.setupAnonymous();
      const setupB = await bootstrap.utils.generalUtils.setupAnonymous();
      const monitor = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
        token: setupA.token,
        clusterId: setupA.cluster.id,
      });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/clusters/${setupA.cluster.id}/monitors/${monitor.id}/http_pings`)
        .set('Authorization', `Bearer ${setupB.token}`);

      // then
      expect(response.status).toBe(403);
    });
  });
});
