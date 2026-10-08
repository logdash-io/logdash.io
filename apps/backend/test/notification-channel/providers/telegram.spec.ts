import { createTestApp } from '../../utils/bootstrap';
import { NotificationChannelMessagingService } from '../../../src/notification-channel/messaging/notification-channel-messaging.service';
import { TelegramOptions } from '../../../src/notification-channel/core/types/telegram-options.type';
import { TelegramSendMessageBody } from '../../utils/telegram-utils';
import { HttpMonitorStatus } from '../../../src/http-monitor/status/enum/http-monitor-status.enum';
import { LogdashLogger } from '../../../src/shared/logdash/aggregate-logger';
import { NOTIFICATIONS_LOGGER } from '../../../src/shared/logdash/logdash-tokens';
import nock from 'nock';

describe('Telegram notification channel', () => {
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    bootstrap = await createTestApp();
  });

  beforeEach(async () => {
    await bootstrap.methods.beforeEach();
    bootstrap.utils.telegramUtils.suppressWelcomeMessages();
  });

  afterAll(async () => {
    await bootstrap.methods.afterAll();
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
            botToken: '123456:valid-bot-token',
            chatId: 'valid-chat-id',
          },
        });

      const requestBodies: TelegramSendMessageBody[] = [];

      bootstrap.utils.telegramUtils.setUpTelegramSendMessageListener({
        botId: (channel.options as TelegramOptions).botToken!,
        onMessage: (body) => {
          requestBodies.push(body);
        },
      });

      // when
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
            botToken: '123456:valid-bot-token',
            chatId: 'valid-chat-id',
          },
        });

      const requestBodies: TelegramSendMessageBody[] = [];

      bootstrap.utils.telegramUtils.setUpTelegramSendMessageListener({
        botId: (channel.options as TelegramOptions).botToken!,
        onMessage: (body) => {
          requestBodies.push(body);
        },
      });

      // when
      const messagingService = bootstrap.app.get(NotificationChannelMessagingService);
      await messagingService.sendHttpMonitorAlertMessage({
        httpMonitorId: 'some-http-monitor-id',
        notificationChannelsIds: [channel.id],
        newStatus: HttpMonitorStatus.Up,
        name: 'test',
        url: 'https://google.com',
      });

      // then
      expect(requestBodies.length).toBe(1);
      expect(requestBodies[0]).toEqual({
        chat_id: 'valid-chat-id',
        text: `🟢  *test* is up`,
      });
    });

    it.each([
      { status: 403, level: 'warn' as const },
      { status: 400, level: 'warn' as const },
      { status: 429, level: 'error' as const },
      { status: 502, level: 'error' as const },
    ])('logs a telegram $status response as $level', async ({ status, level }) => {
      // given
      const { cluster, token } = await bootstrap.utils.generalUtils.setupAnonymous();

      const channel =
        await bootstrap.utils.notificationChannelUtils.createTelegramNotificationChannel({
          clusterId: cluster.id,
          token,
          options: {
            botToken: '123456:kicked-bot-token',
            chatId: 'valid-chat-id',
          },
        });

      nock('https://api.telegram.org')
        .post('/bot123456:kicked-bot-token/sendMessage')
        .query(true)
        .reply(status, { ok: false, description: 'Forbidden: bot was kicked from the group chat' });

      const logger = bootstrap.module.get<LogdashLogger>(NOTIFICATIONS_LOGGER);
      const warn = jest.spyOn(logger, 'warn');
      const error = jest.spyOn(logger, 'error');

      // when
      await bootstrap.app.get(NotificationChannelMessagingService).sendHttpMonitorAlertMessage({
        httpMonitorId: 'some-http-monitor-id',
        notificationChannelsIds: [channel.id],
        newStatus: HttpMonitorStatus.Up,
        name: 'test',
        url: 'https://google.com',
      });

      // then
      expect(level === 'warn' ? warn : error).toHaveBeenCalledWith(
        'Failed to send message to Telegram',
        expect.objectContaining({ status }),
      );
      expect(level === 'warn' ? error : warn).not.toHaveBeenCalled();

      warn.mockRestore();
      error.mockRestore();
    });
  });
});
