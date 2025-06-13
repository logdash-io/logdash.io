import { createTestApp } from '../../utils/bootstrap';
import { NotificationChannelMessagingService } from '../../../src/notification-channel/messaging/notification-channel-messaging.service';
import { TelegramOptions } from '../../../src/notification-channel/core/types/telegram-options.type';
import { sleep } from '../../utils/sleep';
import { HttpMonitorStatus } from '../../../src/http-monitor/status/enum/http-monitor-status.enum';

describe('Telegram notification channel', () => {
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    bootstrap = await createTestApp();
  });

  beforeEach(async () => {
    await bootstrap.methods.beforeEach();
  });

  describe('http monitor alert message', () => {
    it('sends down message with error message', async () => {
      // given
      const { cluster, token } = await bootstrap.utils.generalUtils.setupAnonymous();

      const channel =
        await bootstrap.utils.notificationChannelUtils.createTelegramNotificationChannel({
          clusterId: cluster.id,
          token,
          options: {
            botToken: 'valid-bot-token',
            chatId: 'valid-chat-id',
          },
        });

      const requestBodies: any[] = [];

      bootstrap.utils.telegramUtils.setUpTelegramSendMessageListener({
        botId: (channel.options as TelegramOptions).botToken!,
        onMessage: (body) => {
          requestBodies.push(body);
        },
      });

      // when
      const messagingService = bootstrap.app.get(NotificationChannelMessagingService);
      messagingService.sendHttpMonitorAlertMessage({
        httpMonitorId: 'some-http-monitor-id',
        notificationChannelsIds: [channel.id],
        newStatus: HttpMonitorStatus.Down,
        name: 'test',
        url: 'https://google.com',
        errorMessage: 'test error',
        statusCode: '404',
      });

      await sleep(500);

      const codeBlock = '```';

      // then
      expect(requestBodies.length).toBe(1);
      expect(requestBodies[0]).toEqual({
        chat_id: 'valid-chat-id',
        text: `🔴  *test* is down
${codeBlock}
Status code: 404
Error: test error
${codeBlock}`,
      });
    });

    it('sends up message', async () => {
      // given
      const { cluster, token } = await bootstrap.utils.generalUtils.setupAnonymous();

      const channel =
        await bootstrap.utils.notificationChannelUtils.createTelegramNotificationChannel({
          clusterId: cluster.id,
          token,
          options: {
            botToken: 'valid-bot-token',
            chatId: 'valid-chat-id',
          },
        });

      const requestBodies: any[] = [];

      bootstrap.utils.telegramUtils.setUpTelegramSendMessageListener({
        botId: (channel.options as TelegramOptions).botToken!,
        onMessage: (body) => {
          requestBodies.push(body);
        },
      });

      // when
      const messagingService = bootstrap.app.get(NotificationChannelMessagingService);
      messagingService.sendHttpMonitorAlertMessage({
        httpMonitorId: 'some-http-monitor-id',
        notificationChannelsIds: [channel.id],
        newStatus: HttpMonitorStatus.Up,
        name: 'test',
        url: 'https://google.com',
      });

      await sleep(500);

      // then
      expect(requestBodies.length).toBe(1);
      expect(requestBodies[0]).toEqual({
        chat_id: 'valid-chat-id',
        text: `🟢  *test* is up`,
      });
    });
  });
});
