import { createTestApp } from '../../utils/bootstrap';
import { NotificationChannelMessagingService } from '../../../src/notification-channel/messaging/notification-channel-messaging.service';
import { TelegramOptions } from '../../../src/notification-channel/core/types/telegram-options.type';
import { sleep } from '../../utils/sleep';

describe('Telegram communication channel', () => {
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    bootstrap = await createTestApp();
  });

  beforeEach(async () => {
    await bootstrap.methods.beforeEach();
  });

  it('sends message to telegram', async () => {
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
      botId: (channel.options as TelegramOptions).botToken,
      onMessage: (body) => {
        requestBodies.push(body);
      },
    });

    // when
    const messagingService = bootstrap.app.get(NotificationChannelMessagingService);
    messagingService.sendMessage({
      notificationChannelsIds: [channel.id],
      message: 'test',
    });
    await sleep(500);

    // then
    expect(requestBodies.length).toBe(1);
    expect(requestBodies[0]).toEqual({
      chat_id: 'valid-chat-id',
      text: 'test',
    });
  });
});
