import { createTestApp } from '../../utils/bootstrap';
import { NotificationChannelMessagingService } from '../../../src/notification-channel/messaging/notification-channel-messaging.service';
import { sleep } from '../../utils/sleep';
import { HttpMonitorStatus } from '../../../src/http-monitor/status/enum/http-monitor-status.enum';
import { WebhookHttpMethod } from '../../../src/notification-channel/core/types/webhook-options.type';
import { UserTier } from '../../../src/user/core/enum/user-tier.enum';

describe('Webhook notification channel', () => {
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

  describe('http monitor alert message', () => {
    it('sends down message with error message', async () => {
      const { cluster, token } = await bootstrap.utils.generalUtils.setupClaimed({
        userTier: UserTier.EarlyBird,
      });

      const webhookUrl = 'https://webhook.site/test-webhook';
      const channel =
        await bootstrap.utils.notificationChannelUtils.createWebhookNotificationChannel({
          clusterId: cluster.id,
          token,
          options: {
            url: webhookUrl,
            method: WebhookHttpMethod.POST,
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer test-token',
            },
          },
        });

      const requestBodies: any[] = [];

      bootstrap.utils.webhookUtils.setUpWebhookListener({
        webhookUrl,
        onMessage: (body, headers) => {
          requestBodies.push(body);
        },
      });

      const messagingService = bootstrap.app.get(NotificationChannelMessagingService);
      await messagingService.sendHttpMonitorAlertMessage({
        httpMonitorId: 'some-http-monitor-id',
        notificationChannelsIds: [channel.id],
        newStatus: HttpMonitorStatus.Down,
        name: 'test',
        url: 'https://google.com',
        errorMessage: 'test error',
        statusCode: '404',
      });

      expect(requestBodies.length).toBe(1);
      expect(requestBodies[0]).toEqual({
        httpMonitorId: 'some-http-monitor-id',
        newStatus: HttpMonitorStatus.Down,
        name: 'test',
        url: 'https://google.com',
        errorMessage: 'test error',
        statusCode: '404',
      });
    });

    it('sends up message', async () => {
      const { cluster, token } = await bootstrap.utils.generalUtils.setupClaimed({
        userTier: UserTier.EarlyBird,
      });

      const webhookUrl = 'https://webhook.site/test-webhook-up';
      const channel =
        await bootstrap.utils.notificationChannelUtils.createWebhookNotificationChannel({
          clusterId: cluster.id,
          token,
          options: {
            url: webhookUrl,
            method: WebhookHttpMethod.POST,
          },
        });

      const requestBodies: any[] = [];

      bootstrap.utils.webhookUtils.setUpWebhookListener({
        webhookUrl,
        onMessage: (body) => {
          requestBodies.push(body);
        },
      });

      const messagingService = bootstrap.app.get(NotificationChannelMessagingService);
      messagingService.sendHttpMonitorAlertMessage({
        httpMonitorId: 'some-http-monitor-id',
        notificationChannelsIds: [channel.id],
        newStatus: HttpMonitorStatus.Up,
        name: 'test',
        url: 'https://google.com',
      });

      await sleep(500);

      expect(requestBodies.length).toBe(1);
      expect(requestBodies[0]).toEqual({
        httpMonitorId: 'some-http-monitor-id',
        newStatus: HttpMonitorStatus.Up,
        name: 'test',
        url: 'https://google.com',
        errorMessage: undefined,
        statusCode: undefined,
      });
    });

    it('sends message with custom headers', async () => {
      const { cluster, token } = await bootstrap.utils.generalUtils.setupClaimed({
        userTier: UserTier.EarlyBird,
      });

      const webhookUrl = 'https://webhook.site/test-webhook-headers';
      const customHeaders = {
        'X-Custom-Header': 'custom-value',
        Authorization: 'Bearer custom-token',
      };

      const channel =
        await bootstrap.utils.notificationChannelUtils.createWebhookNotificationChannel({
          clusterId: cluster.id,
          token,
          options: {
            url: webhookUrl,
            method: WebhookHttpMethod.POST,
            headers: customHeaders,
          },
        });

      const requestBodies: any[] = [];
      const requestHeaders: any[] = [];

      bootstrap.utils.webhookUtils.setUpWebhookListener({
        webhookUrl,
        onMessage: (body, headers) => {
          requestBodies.push(body);
          requestHeaders.push(headers);
        },
      });

      const messagingService = bootstrap.app.get(NotificationChannelMessagingService);
      messagingService.sendHttpMonitorAlertMessage({
        httpMonitorId: 'some-http-monitor-id',
        notificationChannelsIds: [channel.id],
        newStatus: HttpMonitorStatus.Down,
        name: 'test webhook with headers',
        url: 'https://example.com',
        errorMessage: 'connection timeout',
        statusCode: '503',
      });

      await sleep(500);

      expect(requestBodies.length).toBe(1);
      expect(requestBodies[0]).toEqual({
        httpMonitorId: 'some-http-monitor-id',
        newStatus: HttpMonitorStatus.Down,
        name: 'test webhook with headers',
        url: 'https://example.com',
        errorMessage: 'connection timeout',
        statusCode: '503',
      });
      expect(requestHeaders[0]).toMatchObject({
        'content-type': 'application/json',
        authorization: 'Bearer custom-token',
        'x-custom-header': 'custom-value',
      });
    });

    describe('different HTTP methods', () => {
      const httpMethods = Object.values(WebhookHttpMethod);
      const testData = {
        httpMonitorId: 'some-http-monitor-id',
        newStatus: HttpMonitorStatus.Down,
        name: 'test webhook with different methods',
        url: 'https://example.com',
        errorMessage: 'connection timeout',
        statusCode: '503',
      };

      httpMethods.forEach((method) => {
        it(`sends message using ${method} method`, async () => {
          const { cluster, token } = await bootstrap.utils.generalUtils.setupClaimed({
            userTier: UserTier.EarlyBird,
          });

          const webhookUrl = `https://webhook.site/test-webhook-${method.toLowerCase()}`;
          const customHeaders = {
            'X-Custom-Header': 'custom-value',
            Authorization: 'Bearer custom-token',
          };

          const channel =
            await bootstrap.utils.notificationChannelUtils.createWebhookNotificationChannel({
              clusterId: cluster.id,
              token,
              options: {
                url: webhookUrl,
                headers: customHeaders,
                method,
              },
            });

          const requestBodies: any[] = [];
          const requestHeaders: any[] = [];

          bootstrap.utils.webhookUtils.setUpWebhookListenerWithMethod({
            webhookUrl,
            method,
            onMessage: (body, headers) => {
              requestBodies.push(body);
              requestHeaders.push(headers);
            },
          });

          const messagingService = bootstrap.app.get(NotificationChannelMessagingService);
          await messagingService.sendHttpMonitorAlertMessage({
            ...testData,
            notificationChannelsIds: [channel.id],
          });

          expect(requestHeaders[0]).toMatchObject({
            authorization: 'Bearer custom-token',
            'x-custom-header': 'custom-value',
          });
        });
      });
    });
  });
});
