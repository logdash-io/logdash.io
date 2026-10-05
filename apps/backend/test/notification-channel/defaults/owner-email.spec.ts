import request from 'supertest';
import { createTestApp } from '../../utils/bootstrap';
import { NotificationChannelType } from '../../../src/notification-channel/core/enums/notification-target.enum';
import { NotificationChannelDefaultsService } from '../../../src/notification-channel/defaults/notification-channel-defaults.service';

describe('Owner email alerts', () => {
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

  const claim = (token: string, monitorId: string): request.Test =>
    request(bootstrap.app.getHttpServer())
      .post(`/http_monitors/${monitorId}/claim`)
      .set('Authorization', `Bearer ${token}`);

  const channelsOf = async (monitorId: string): Promise<string[]> =>
    (await bootstrap.models.httpMonitorModel.findById(monitorId))!.notificationChannelsIds;

  it('sends alerts of a claimed monitor to the owner email, one channel per domain', async () => {
    // given
    const { token, project, cluster } = await bootstrap.utils.generalUtils.setupClaimed({
      email: 'owner@example.com',
    });
    const first = await bootstrap.utils.httpMonitorsUtils.storeHttpMonitor({
      projectId: project.id,
    });
    const second = await bootstrap.utils.httpMonitorsUtils.storeHttpMonitor({
      projectId: project.id,
    });

    // when
    await claim(token, first.id).expect(201);
    await claim(token, second.id);

    // then
    const channels = await bootstrap.models.notificationChannelModel.find({
      clusterId: cluster.id,
    });
    expect(channels).toHaveLength(1);
    expect(channels[0].target).toBe(NotificationChannelType.Email);
    expect(channels[0].options).toEqual({ email: 'owner@example.com' });
    expect(await channelsOf(first.id)).toEqual([channels[0]._id.toString()]);
  });

  it('leaves a monitor that already has channels alone', async () => {
    // given
    const { token, project, cluster } = await bootstrap.utils.generalUtils.setupClaimed();
    const webhook = await bootstrap.utils.notificationChannelUtils.createWebhookNotificationChannel(
      {
        clusterId: cluster.id,
        token,
        options: { url: 'https://hooks.example.com/alerts' },
      },
    );
    const monitor = await bootstrap.utils.httpMonitorsUtils.storeHttpMonitor({
      projectId: project.id,
      notificationChannelsIds: [webhook.id],
    });

    // when
    await claim(token, monitor.id).expect(201);

    // then
    expect(await channelsOf(monitor.id)).toEqual([webhook.id]);
  });

  it('adds nothing for an anonymous user, then turns alerts on once the account is claimed', async () => {
    // given
    const { token, project, user } = await bootstrap.utils.generalUtils.setupAnonymous();
    const monitor = await bootstrap.utils.httpMonitorsUtils.storeHttpMonitor({
      projectId: project.id,
    });
    await claim(token, monitor.id).expect(201);
    expect(await channelsOf(monitor.id)).toEqual([]);

    // when
    await bootstrap.models.userModel.updateOne(
      { _id: user.id },
      { accountClaimStatus: 'claimed', email: 'new@example.com' },
    );
    await bootstrap.app
      .get(NotificationChannelDefaultsService)
      .onAccountClaimed({ userId: user.id });

    // then
    expect(await channelsOf(monitor.id)).toHaveLength(1);
  });
});
