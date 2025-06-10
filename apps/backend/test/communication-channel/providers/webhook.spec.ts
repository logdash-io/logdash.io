import { createTestApp } from '../../utils/bootstrap';
import { NotificationsChannelMessagingService } from '../../../src/notifications-channel/messaging/notifications-channel-messaging.service';
import {
  WebhookOptions,
  WebhookHttpMethod,
} from '../../../src/notifications-channel/core/types/webhook-options.type';
import { sleep } from '../../utils/sleep';

describe('Webhook communication channel', () => {
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    bootstrap = await createTestApp();
  });

  beforeEach(async () => {
    await bootstrap.methods.beforeEach();
  });

  it('sends message to webhook with POST method', async () => {
    const { cluster, token } = await bootstrap.utils.generalUtils.setupAnonymous();

    const channel =
      await bootstrap.utils.notificationsChannelUtils.createWebhookNotificationsChannel({
        clusterId: cluster.id,
        token,
        options: {
          url: 'https://api.example.com/webhook',
          method: WebhookHttpMethod.POST,
          headers: {
            Authorization: 'Bearer secret-token',
          },
        },
      });

    const requestBodies: any[] = [];

    bootstrap.utils.webhookUtils.setUpWebhookListener({
      url: (channel.options as WebhookOptions).url,
      method: (channel.options as WebhookOptions).method,
      onMessage: (body) => {
        requestBodies.push(body);
      },
    });

    const messagingService = bootstrap.app.get(NotificationsChannelMessagingService);
    messagingService.sendMessage({
      notificationsChannelIds: [channel.id],
      message: 'test webhook message',
    });
    await sleep(500);

    expect(requestBodies.length).toBe(1);
    expect(requestBodies[0]).toEqual({
      message: 'test webhook message',
    });
  });
});
