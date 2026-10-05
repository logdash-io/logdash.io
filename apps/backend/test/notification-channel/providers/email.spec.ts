import { createTestApp } from '../../utils/bootstrap';
import { NotificationChannelMessagingService } from '../../../src/notification-channel/messaging/notification-channel-messaging.service';
import { HttpMonitorStatus } from '../../../src/http-monitor/status/enum/http-monitor-status.enum';
import { ResendTemplatedEmailsService } from '../../../src/email/resend/resend-templated-emails.service';
import { getEnvConfig } from '../../../src/shared/configs/env-configs';
import { NotificationChannelSerialized } from '../../../src/notification-channel/core/entities/notification-channel.interface';

describe('Email notification channel', () => {
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;
  let sendAlertEmail: jest.SpyInstance;

  beforeAll(async () => {
    bootstrap = await createTestApp();
  });

  beforeEach(async () => {
    await bootstrap.methods.beforeEach();
    sendAlertEmail = jest
      .spyOn(bootstrap.app.get(ResendTemplatedEmailsService), 'sendHttpMonitorAlertEmail')
      .mockResolvedValue();
  });

  afterEach(() => {
    sendAlertEmail.mockRestore();
    getEnvConfig().resend.enabled = false;
  });

  afterAll(async () => {
    await bootstrap.methods.afterAll();
  });

  const sendDownAlert = async (): Promise<{ channel: NotificationChannelSerialized }> => {
    const { cluster, token } = await bootstrap.utils.generalUtils.setupClaimed({
      email: 'owner@example.com',
    });
    const response = await bootstrap.utils.notificationChannelUtils.createEmailNotificationChannel({
      clusterId: cluster.id,
      token,
      email: 'owner@example.com',
    });
    const channel = response.body as NotificationChannelSerialized;

    await bootstrap.app.get(NotificationChannelMessagingService).sendHttpMonitorAlertMessage({
      httpMonitorId: 'some-http-monitor-id',
      notificationChannelsIds: [channel.id],
      newStatus: HttpMonitorStatus.Down,
      name: 'example.com',
      url: 'https://example.com',
      errorMessage: 'Request failed',
      statusCode: '503',
    });

    return { channel };
  };

  it('emails the down alert to the channel address', async () => {
    // given
    getEnvConfig().resend.enabled = true;

    // when
    const { channel } = await sendDownAlert();

    // then
    expect(sendAlertEmail).toHaveBeenCalledWith('owner@example.com', {
      name: 'example.com',
      url: 'https://example.com',
      up: false,
      statusCode: '503',
      errorMessage: 'Request failed',
      dashboardUrl: `${getEnvConfig().app.url}/app/domains/${channel.clusterId}`,
    });
  });

  it('sends nothing while email delivery is off', async () => {
    // when
    await sendDownAlert();

    // then
    expect(sendAlertEmail).not.toHaveBeenCalled();
  });
});
