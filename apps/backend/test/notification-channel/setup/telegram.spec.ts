import * as request from 'supertest';
import { createTestApp } from '../../utils/bootstrap';
import { getEnvConfig } from '../../../src/shared/configs/env-configs';
import { TelegramUpdateDto } from '../../../src/notification-channel/setup/telegram/dto/telegram-update.dto';
import { TelegramTestMessageBody } from '../../../src/notification-channel/setup/telegram/dto/telegram-test-message.body';
import { sleep } from '../../utils/sleep';

describe('TelegramSetupController', () => {
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

  const validTelegramSecret = getEnvConfig().notificationChannels.telegramUptimeBot.secret;

  describe('POST /notification_channel_setup/telegram/bot_webhook', () => {
    it('processes webhook update with valid secret', async () => {
      const telegramUpdate: TelegramUpdateDto = {
        update_id: 123456,
        message: {
          message_id: 1,
          from: {
            id: 987654321,
            is_bot: false,
            first_name: 'John',
            last_name: 'Doe',
            username: 'johndoe',
          },
          chat: {
            id: 123456789,
            type: 'private',
            first_name: 'John',
            last_name: 'Doe',
            username: 'johndoe',
          },
          date: Math.floor(Date.now() / 1000),
          text: '/private-test-phrase',
        },
      };

      const webhookResponse = await request(bootstrap.app.getHttpServer())
        .post('/notification_channel_setup/telegram/bot_webhook')
        .set('X-Telegram-Bot-Api-Secret-Token', validTelegramSecret)
        .send(telegramUpdate);

      expect(webhookResponse.status).toBe(201);
    });

    it('processes webhook update for group chat', async () => {
      const groupPassphrase = '/group-test-phrase';
      const telegramUpdate: TelegramUpdateDto = {
        update_id: 123457,
        message: {
          message_id: 2,
          from: {
            id: 987654321,
            is_bot: false,
            first_name: 'John',
            username: 'johndoe',
          },
          chat: {
            id: 987654321,
            type: 'group',
            title: 'Dev Team Group',
          },
          date: Math.floor(Date.now() / 1000),
          text: groupPassphrase,
        },
      };

      const webhookResponse = await request(bootstrap.app.getHttpServer())
        .post('/notification_channel_setup/telegram/bot_webhook')
        .set('X-Telegram-Bot-Api-Secret-Token', validTelegramSecret)
        .send(telegramUpdate);

      expect(webhookResponse.status).toBe(201);
    });

    it('rejects webhook update with invalid secret', async () => {
      const telegramUpdate: TelegramUpdateDto = {
        update_id: 123458,
        message: {
          message_id: 3,
          from: {
            id: 987654321,
            is_bot: false,
            first_name: 'John',
          },
          chat: {
            id: 123456789,
            type: 'private',
            first_name: 'John',
          },
          date: Math.floor(Date.now() / 1000),
          text: 'invalid-secret-test',
        },
      };

      const response = await request(bootstrap.app.getHttpServer())
        .post('/notification_channel_setup/telegram/bot_webhook')
        .set('X-Telegram-Bot-Api-Secret-Token', 'invalid-secret')
        .send(telegramUpdate);

      expect(response.status).toBe(201);
    });

    it('rejects webhook update with invalid passphrase', async () => {
      const telegramUpdate: TelegramUpdateDto = {
        update_id: 123459,
        message: {
          message_id: 4,
          from: {
            id: 987654321,
            is_bot: false,
            first_name: 'John',
          },
          chat: {
            id: 123456789,
            type: 'private',
            first_name: 'John',
          },
          date: Math.floor(Date.now() / 1000),
          text: 'invalid-passphrase-test',
        },
      };

      const response = await request(bootstrap.app.getHttpServer())
        .post('/notification_channel_setup/telegram/bot_webhook')
        .set('X-Telegram-Bot-Api-Secret-Token', validTelegramSecret)
        .send(telegramUpdate);

      expect(response.status).toBe(201);
    });
  });

  describe('GET /notification_channel_setup/telegram/chat_info', () => {
    it('gets private chat info', async () => {
      const { token } = await bootstrap.utils.generalUtils.setupAnonymous();

      const telegramUpdate: TelegramUpdateDto = {
        update_id: 123456,
        message: {
          message_id: 1,
          from: {
            id: 987654321,
            is_bot: false,
            first_name: 'John',
            last_name: 'Doe',
            username: 'johndoe',
          },
          chat: {
            id: 123456789,
            type: 'private',
            first_name: 'John',
            last_name: 'Doe',
            username: 'johndoe',
          },
          date: Math.floor(Date.now() / 1000),
          text: '/private-test-phrase',
        },
      };

      await request(bootstrap.app.getHttpServer())
        .post('/notification_channel_setup/telegram/bot_webhook')
        .set('X-Telegram-Bot-Api-Secret-Token', validTelegramSecret)
        .send(telegramUpdate);

      const chatInfoResponse = await request(bootstrap.app.getHttpServer())
        .get('/notification_channel_setup/telegram/chat_info')
        .set('Authorization', `Bearer ${token}`)
        .query({ passphrase: '/private-test-phrase' });

      expect(chatInfoResponse.status).toBe(200);
      expect(chatInfoResponse.body).toEqual({
        success: true,
        chatId: '123456789',
        name: 'John Doe',
      });
    });

    it('gets group chat info', async () => {
      const { token } = await bootstrap.utils.generalUtils.setupAnonymous();

      const groupPassphrase = '/group-test-phrase';
      const telegramUpdate: TelegramUpdateDto = {
        update_id: 123457,
        message: {
          message_id: 2,
          from: {
            id: 987654321,
            is_bot: false,
            first_name: 'John',
            username: 'johndoe',
          },
          chat: {
            id: 987654321,
            type: 'group',
            title: 'Dev Team Group',
          },
          date: Math.floor(Date.now() / 1000),
          text: groupPassphrase,
        },
      };

      await request(bootstrap.app.getHttpServer())
        .post('/notification_channel_setup/telegram/bot_webhook')
        .set('X-Telegram-Bot-Api-Secret-Token', validTelegramSecret)
        .send(telegramUpdate);

      const chatInfoResponse = await request(bootstrap.app.getHttpServer())
        .get('/notification_channel_setup/telegram/chat_info')
        .set('Authorization', `Bearer ${token}`)
        .query({ passphrase: groupPassphrase });

      expect(chatInfoResponse.status).toBe(200);
      expect(chatInfoResponse.body).toEqual({
        success: true,
        chatId: '987654321',
        name: 'Dev Team Group',
      });
    });

    it('returns failure for invalid secret webhook data', async () => {
      const { token } = await bootstrap.utils.generalUtils.setupAnonymous();

      await request(bootstrap.app.getHttpServer())
        .post('/notification_channel_setup/telegram/bot_webhook')
        .set('X-Telegram-Bot-Api-Secret-Token', 'invalid-secret')
        .send({
          update_id: 123458,
          message: {
            message_id: 3,
            from: { id: 987654321, is_bot: false, first_name: 'John' },
            chat: { id: 123456789, type: 'private', first_name: 'John' },
            date: Math.floor(Date.now() / 1000),
            text: 'invalid-secret-test',
          },
        });

      const chatInfoResponse = await request(bootstrap.app.getHttpServer())
        .get('/notification_channel_setup/telegram/chat_info')
        .set('Authorization', `Bearer ${token}`)
        .query({ passphrase: 'invalid-secret-test' });

      expect(chatInfoResponse.status).toBe(200);
      expect(chatInfoResponse.body).toEqual({
        success: false,
      });
    });

    it('returns failure for invalid passphrase', async () => {
      const { token } = await bootstrap.utils.generalUtils.setupAnonymous();

      await request(bootstrap.app.getHttpServer())
        .post('/notification_channel_setup/telegram/bot_webhook')
        .set('X-Telegram-Bot-Api-Secret-Token', validTelegramSecret)
        .send({
          update_id: 123459,
          message: {
            message_id: 4,
            from: { id: 987654321, is_bot: false, first_name: 'John' },
            chat: { id: 123456789, type: 'private', first_name: 'John' },
            date: Math.floor(Date.now() / 1000),
            text: 'invalid-passphrase-test',
          },
        });

      const chatInfoResponse = await request(bootstrap.app.getHttpServer())
        .get('/notification_channel_setup/telegram/chat_info')
        .set('Authorization', `Bearer ${token}`)
        .query({ passphrase: 'invalid-passphrase-test' });

      expect(chatInfoResponse.status).toBe(200);
      expect(chatInfoResponse.body).toEqual({
        success: false,
      });
    });
  });

  describe('POST /notification_channel_setup/telegram/send_test_message', () => {
    it('sends test message successfully', async () => {
      const { token } = await bootstrap.utils.generalUtils.setupAnonymous();

      const testMessageBody: TelegramTestMessageBody = {
        chatId: '123456789',
        message: 'This is a test message from the notification system',
      };

      const requestBodies: any[] = [];

      bootstrap.utils.telegramUtils.setUpTelegramSendMessageListener({
        botId: getEnvConfig().notificationChannels.telegramUptimeBot.token,
        onMessage: (body) => {
          requestBodies.push(body);
        },
      });

      const response = await request(bootstrap.app.getHttpServer())
        .post('/notification_channel_setup/telegram/send_test_message')
        .set('Authorization', `Bearer ${token}`)
        .send(testMessageBody);

      expect(response.status).toBe(201);
      expect(requestBodies.length).toBe(1);
      expect(requestBodies[0]).toEqual({
        chat_id: testMessageBody.chatId,
        text: testMessageBody.message,
      });
    });

    it('enforces rate limit for test messages', async () => {
      const { token } = await bootstrap.utils.generalUtils.setupAnonymous();

      const testMessageBody: TelegramTestMessageBody = {
        chatId: '123456789',
        message: 'This is a test message',
      };

      bootstrap.utils.telegramUtils.setUpTelegramSendMessageListener({
        botId: getEnvConfig().notificationChannels.telegramUptimeBot.token,
        onMessage: () => {},
      });

      const firstResponse = await request(bootstrap.app.getHttpServer())
        .post('/notification_channel_setup/telegram/send_test_message')
        .set('Authorization', `Bearer ${token}`)
        .send(testMessageBody);

      expect(firstResponse.status).toBe(201);

      const secondResponse = await request(bootstrap.app.getHttpServer())
        .post('/notification_channel_setup/telegram/send_test_message')
        .set('Authorization', `Bearer ${token}`)
        .send(testMessageBody);

      expect(secondResponse.status).toBe(429);
      expect(secondResponse.body.message).toContain('Rate limit exceeded');
    });

    it('allows test messages after rate limit expires', async () => {
      const { token } = await bootstrap.utils.generalUtils.setupAnonymous();

      const testMessageBody: TelegramTestMessageBody = {
        chatId: '123456789',
        message: 'This is a test message',
      };

      const requestBodies: any[] = [];

      bootstrap.utils.telegramUtils.setUpTelegramSendMessageListener({
        botId: getEnvConfig().notificationChannels.telegramUptimeBot.token,
        onMessage: (body) => {
          requestBodies.push(body);
        },
      });

      const firstResponse = await request(bootstrap.app.getHttpServer())
        .post('/notification_channel_setup/telegram/send_test_message')
        .set('Authorization', `Bearer ${token}`)
        .send(testMessageBody);

      expect(firstResponse.status).toBe(201);

      await sleep(3_100);

      const secondResponse = await request(bootstrap.app.getHttpServer())
        .post('/notification_channel_setup/telegram/send_test_message')
        .set('Authorization', `Bearer ${token}`)
        .send(testMessageBody);

      expect(secondResponse.status).toBe(201);
      expect(requestBodies.length).toBe(2);
    });

    it('requires authentication for send test message', async () => {
      const testMessageBody: TelegramTestMessageBody = {
        chatId: '123456789',
        message: 'This is a test message',
      };

      const response = await request(bootstrap.app.getHttpServer())
        .post('/notification_channel_setup/telegram/send_test_message')
        .send(testMessageBody);

      expect(response.status).toBe(401);
    });
  });
});
