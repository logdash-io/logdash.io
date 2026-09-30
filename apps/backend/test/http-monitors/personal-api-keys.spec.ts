import nock from 'nock';
import request from 'supertest';
import { createTestApp } from '../utils/bootstrap';
import { ErrorResponse } from '../utils/error-response';
import { Action } from '../../src/personal-api-key/core/enums/action.enum';
import { Resource } from '../../src/personal-api-key/core/enums/resource.enum';
import { AccessRestriction } from '../../src/personal-api-key/core/types/access-restriction.type';
import { ScopeEntry } from '../../src/personal-api-key/core/types/scope-entry.type';
import { CreatePersonalApiKeyResponse } from '../../src/personal-api-key/core/dto/create-personal-api-key.response';
import { CreateHttpMonitorBody } from '../../src/http-monitor/core/dto/create-http-monitor.body';
import { UpdateHttpMonitorBody } from '../../src/http-monitor/core/dto/update-http-monitor.body';
import { HttpMonitorSerialized } from '../../src/http-monitor/core/entities/http-monitor.interface';
import { HttpMonitorMode } from '../../src/http-monitor/core/enums/http-monitor-mode.enum';
import { BucketsResponse } from '../../src/http-ping-bucket/core/types/buckets.response';

describe('HttpMonitorCoreController (personal API keys)', () => {
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
  });

  afterAll(async () => {
    nock.cleanAll();
    await bootstrap.methods.afterAll();
  });

  const server = () => bootstrap.app.getHttpServer();

  const createKey = async (
    token: string,
    scopes: ScopeEntry[],
    access: AccessRestriction = { kind: 'all' },
  ): Promise<string> => {
    const response = await request(server())
      .post('/personal-api-keys')
      .set('Authorization', `Bearer ${token}`)
      .send({ label: 'outreach', scopes, access });

    expect(response.status).toBe(201);

    return (response.body as CreatePersonalApiKeyResponse).value;
  };

  it('lets a monitors write key create, claim, list, update and read buckets of a monitor, but not delete it', async () => {
    // given
    const { token, project, cluster } = await bootstrap.utils.generalUtils.setupAnonymous();
    const channel =
      await bootstrap.utils.notificationChannelUtils.createTelegramNotificationChannel({
        clusterId: cluster.id,
        token,
        options: { botToken: '123456:valid-bot-token' },
      });
    const key = await createKey(token, [{ resource: Resource.Monitors, action: Action.Write }]);
    const body: CreateHttpMonitorBody = {
      name: 'prospect',
      url: 'https://example.com',
      mode: HttpMonitorMode.Pull,
      notificationChannelsIds: [channel.id],
    };

    // when
    const created = await request(server())
      .post(`/projects/${project.id}/http_monitors`)
      .set('Authorization', `Bearer ${key}`)
      .send(body);
    const monitorId = (created.body as HttpMonitorSerialized).id;
    const claimed = await request(server())
      .post(`/http_monitors/${monitorId}/claim`)
      .set('Authorization', `Bearer ${key}`);
    const listed = await request(server())
      .get(`/projects/${project.id}/http_monitors`)
      .set('Authorization', `Bearer ${key}`);
    const updateBody: UpdateHttpMonitorBody = { name: 'renamed' };
    const updated = await request(server())
      .put(`/http_monitors/${monitorId}`)
      .set('Authorization', `Bearer ${key}`)
      .send(updateBody);
    const buckets = await request(server())
      .get(`/monitors/${monitorId}/http_ping_buckets?period=90d`)
      .set('Authorization', `Bearer ${key}`);
    const deleted = await request(server())
      .delete(`/http_monitors/${monitorId}`)
      .set('Authorization', `Bearer ${key}`);

    // then
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ notificationChannelsIds: [channel.id] });
    expect(claimed.status).toBe(201);
    expect(listed.status).toBe(200);
    expect((listed.body as HttpMonitorSerialized[]).map((monitor) => monitor.id)).toEqual([
      monitorId,
    ]);
    expect(updated.status).toBe(200);
    expect(updated.body).toMatchObject({ name: 'renamed' });
    expect(buckets.status).toBe(200);
    expect((buckets.body as BucketsResponse).buckets).toHaveLength(90);
    expect(deleted.status).toBe(403);
    expect((deleted.body as ErrorResponse).message).toBe('Missing scope monitors:delete');
    expect(await bootstrap.models.httpMonitorModel.countDocuments()).toBe(1);
  });

  it('lets a monitors delete key read and delete a monitor', async () => {
    // given
    const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();
    const monitor = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
      token,
      projectId: project.id,
    });
    const key = await createKey(token, [{ resource: Resource.Monitors, action: Action.Delete }]);

    // when
    const listed = await request(server())
      .get(`/projects/${project.id}/http_monitors`)
      .set('Authorization', `Bearer ${key}`);
    const deleted = await request(server())
      .delete(`/http_monitors/${monitor.id}`)
      .set('Authorization', `Bearer ${key}`);

    // then
    expect(listed.status).toBe(200);
    expect((listed.body as HttpMonitorSerialized[]).map((item) => item.id)).toEqual([monitor.id]);
    expect(deleted.status).toBe(200);
    expect(await bootstrap.models.httpMonitorModel.countDocuments()).toBe(0);
  });

  it('lets a monitors write key attach and detach a notification channel', async () => {
    // given
    const { token, project, cluster } = await bootstrap.utils.generalUtils.setupAnonymous();
    const channel =
      await bootstrap.utils.notificationChannelUtils.createTelegramNotificationChannel({
        clusterId: cluster.id,
        token,
        options: { botToken: '123456:valid-bot-token' },
      });
    const monitor = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
      token,
      projectId: project.id,
    });
    const key = await createKey(token, [{ resource: Resource.Monitors, action: Action.Write }]);
    const path = `/http_monitors/${monitor.id}/notification_channels/${channel.id}`;

    // when
    const attached = await request(server()).post(path).set('Authorization', `Bearer ${key}`);
    const afterAttach = await bootstrap.models.httpMonitorModel.findById(monitor.id).lean();
    const detached = await request(server()).delete(path).set('Authorization', `Bearer ${key}`);
    const afterDetach = await bootstrap.models.httpMonitorModel.findById(monitor.id).lean();

    // then
    expect(attached.status).toBe(201);
    expect(afterAttach!.notificationChannelsIds).toEqual([channel.id]);
    expect(detached.status).toBe(200);
    expect(afterDetach!.notificationChannelsIds).toEqual([]);
  });

  it('denies every monitor write and delete route to a monitors read key', async () => {
    // given
    const { token, project, cluster } = await bootstrap.utils.generalUtils.setupAnonymous();
    const channel =
      await bootstrap.utils.notificationChannelUtils.createTelegramNotificationChannel({
        clusterId: cluster.id,
        token,
        options: { botToken: '123456:valid-bot-token' },
      });
    const monitor = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
      token,
      projectId: project.id,
    });
    const key = await createKey(token, [{ resource: Resource.Monitors, action: Action.Read }]);
    const createBody: CreateHttpMonitorBody = {
      name: 'prospect',
      url: 'https://example.com',
      mode: HttpMonitorMode.Pull,
    };
    const updateBody: UpdateHttpMonitorBody = { name: 'renamed' };
    const channelPath = `/http_monitors/${monitor.id}/notification_channels/${channel.id}`;

    // when
    const responses = [
      await request(server())
        .post(`/projects/${project.id}/http_monitors`)
        .set('Authorization', `Bearer ${key}`)
        .send(createBody),
      await request(server())
        .put(`/http_monitors/${monitor.id}`)
        .set('Authorization', `Bearer ${key}`)
        .send(updateBody),
      await request(server())
        .post(`/http_monitors/${monitor.id}/claim`)
        .set('Authorization', `Bearer ${key}`),
      await request(server()).post(channelPath).set('Authorization', `Bearer ${key}`),
      await request(server()).delete(channelPath).set('Authorization', `Bearer ${key}`),
    ];
    const deleted = await request(server())
      .delete(`/http_monitors/${monitor.id}`)
      .set('Authorization', `Bearer ${key}`);

    // then
    for (const response of responses) {
      expect(response.status).toBe(403);
      expect((response.body as ErrorResponse).message).toBe('Missing scope monitors:write');
    }
    expect(deleted.status).toBe(403);
    expect((deleted.body as ErrorResponse).message).toBe('Missing scope monitors:delete');
    expect(await bootstrap.models.httpMonitorModel.countDocuments()).toBe(1);
  });

  it('denies reading buckets to a key without the monitors scope', async () => {
    // given
    const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();
    const monitor = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
      token,
      projectId: project.id,
    });
    const key = await createKey(token, [{ resource: Resource.Logs, action: Action.Read }]);

    // when
    const response = await request(server())
      .get(`/monitors/${monitor.id}/http_ping_buckets?period=90d`)
      .set('Authorization', `Bearer ${key}`);

    // then
    expect(response.status).toBe(403);
    expect((response.body as ErrorResponse).message).toBe('Missing scope monitors:read');
  });

  it('resolves the monitor project for a project restricted key', async () => {
    // given
    const { token, project, cluster, user } = await bootstrap.utils.generalUtils.setupAnonymous();
    const otherProject = await bootstrap.utils.projectUtils.createDefaultProject({
      userId: user.id,
      clusterId: cluster.id,
    });
    const monitor = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
      token,
      projectId: project.id,
    });
    const channel =
      await bootstrap.utils.notificationChannelUtils.createTelegramNotificationChannel({
        clusterId: cluster.id,
        token,
        options: { botToken: '123456:valid-bot-token' },
      });
    const channelPath = `/http_monitors/${monitor.id}/notification_channels/${channel.id}`;
    const scopes = [{ resource: Resource.Monitors, action: Action.Delete }];
    const ownProjectKey = await createKey(token, scopes, { kind: 'projects', ids: [project.id] });
    const otherProjectKey = await createKey(token, scopes, {
      kind: 'projects',
      ids: [otherProject.id],
    });

    // when
    const allowed = await request(server())
      .get(`/monitors/${monitor.id}/http_ping_buckets?period=90h`)
      .set('Authorization', `Bearer ${ownProjectKey}`);
    const deniedRead = await request(server())
      .get(`/monitors/${monitor.id}/http_ping_buckets?period=90h`)
      .set('Authorization', `Bearer ${otherProjectKey}`);
    const deniedDelete = await request(server())
      .delete(`/http_monitors/${monitor.id}`)
      .set('Authorization', `Bearer ${otherProjectKey}`);
    const allowedAttach = await request(server())
      .post(channelPath)
      .set('Authorization', `Bearer ${ownProjectKey}`);
    const deniedDetach = await request(server())
      .delete(channelPath)
      .set('Authorization', `Bearer ${otherProjectKey}`);

    // then
    expect(allowed.status).toBe(200);
    expect(deniedRead.status).toBe(403);
    expect(deniedDelete.status).toBe(403);
    expect(allowedAttach.status).toBe(201);
    expect(deniedDetach.status).toBe(403);
    expect(await bootstrap.models.httpMonitorModel.findById(monitor.id).lean()).toMatchObject({
      notificationChannelsIds: [channel.id],
    });
    expect(await bootstrap.models.httpMonitorModel.countDocuments()).toBe(1);
  });

  it('denies a key to a monitor in a cluster its owner is not a member of', async () => {
    // given
    const owner = await bootstrap.utils.generalUtils.setupAnonymous();
    const stranger = await bootstrap.utils.generalUtils.setupAnonymous();
    const monitor = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
      token: stranger.token,
      projectId: stranger.project.id,
    });
    const key = await createKey(owner.token, [
      { resource: Resource.Monitors, action: Action.Write },
    ]);

    // when
    const created = await request(server())
      .post(`/projects/${stranger.project.id}/http_monitors`)
      .set('Authorization', `Bearer ${key}`)
      .send({ name: 'prospect', url: 'https://example.com', mode: HttpMonitorMode.Pull });
    const buckets = await request(server())
      .get(`/monitors/${monitor.id}/http_ping_buckets?period=90d`)
      .set('Authorization', `Bearer ${key}`);

    // then
    expect(created.status).toBe(403);
    expect(buckets.status).toBe(403);
  });
});
