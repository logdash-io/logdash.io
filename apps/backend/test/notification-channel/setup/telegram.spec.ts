import request from 'supertest';
import { createTestApp } from '../../utils/bootstrap';
import { getEnvConfig } from '../../../src/shared/configs/env-configs';
import { TelegramUpdateDto } from '../../../src/notification-channel/setup/telegram/dto/telegram-update.dto';
import { RedisService } from '../../../src/shared/redis/redis.service';

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
          text: '/swift_fox_0123456789abcdef',
        },
      };

      const webhookResponse = await request(bootstrap.app.getHttpServer())
        .post('/notification_channel_setup/telegram/bot_webhook')
        .set('X-Telegram-Bot-Api-Secret-Token', validTelegramSecret)
        .send(telegramUpdate);

      expect(webhookResponse.status).toBe(201);
    });

    it('processes webhook update for group chat', async () => {
      const groupPassphrase = '/calm_owl_fedcba9876543210';
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
          text: '/bold_lynx_1111111111111111',
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
          text: '/swift_fox_0123456789abcdef',
        },
      };

      await request(bootstrap.app.getHttpServer())
        .post('/notification_channel_setup/telegram/bot_webhook')
        .set('X-Telegram-Bot-Api-Secret-Token', validTelegramSecret)
        .send(telegramUpdate);

      const chatInfoResponse = await request(bootstrap.app.getHttpServer())
        .get('/notification_channel_setup/telegram/chat_info')
        .set('Authorization', `Bearer ${token}`)
        .query({ passphrase: '/swift_fox_0123456789abcdef' });

      expect(chatInfoResponse.status).toBe(200);
      expect(chatInfoResponse.body).toEqual({
        success: true,
        chatId: '123456789',
        name: 'John Doe',
      });
    });

    it('gets group chat info', async () => {
      const { token } = await bootstrap.utils.generalUtils.setupAnonymous();

      const groupPassphrase = '/calm_owl_fedcba9876543210';
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
            text: '/bold_lynx_1111111111111111',
          },
        });

      const chatInfoResponse = await request(bootstrap.app.getHttpServer())
        .get('/notification_channel_setup/telegram/chat_info')
        .set('Authorization', `Bearer ${token}`)
        .query({ passphrase: '/bold_lynx_1111111111111111' });

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
        .query({ passphrase: '/gentle_deer_2222222222222222' });

      expect(chatInfoResponse.status).toBe(200);
      expect(chatInfoResponse.body).toEqual({
        success: false,
      });
    });
  });

  describe('passphrase abuse', () => {
    const sendUpdate = (text: string, chatId = 123456789) =>
      request(bootstrap.app.getHttpServer())
        .post('/notification_channel_setup/telegram/bot_webhook')
        .set('X-Telegram-Bot-Api-Secret-Token', validTelegramSecret)
        .send({
          update_id: 1,
          message: {
            message_id: 1,
            from: { id: chatId, is_bot: false, first_name: 'Victim' },
            chat: { id: chatId, type: 'private', first_name: 'Victim' },
            date: Math.floor(Date.now() / 1000),
            text,
          },
        });

    it('does not store ordinary bot commands such as /start', async () => {
      // given
      const { token } = await bootstrap.utils.generalUtils.setupAnonymous();
      await sendUpdate('/start');

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get('/notification_channel_setup/telegram/chat_info')
        .set('Authorization', `Bearer ${token}`)
        .query({ passphrase: '/start' });

      // then
      expect(response.status).toBe(400);
      expect(
        await bootstrap.app.get(RedisService).keys('notification-channel-setup:telegram:*'),
      ).toEqual([]);
    });

    it('rejects low-entropy passphrases', async () => {
      // given
      const { token } = await bootstrap.utils.generalUtils.setupAnonymous();
      await sendUpdate('/swift_fox_42');

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get('/notification_channel_setup/telegram/chat_info')
        .set('Authorization', `Bearer ${token}`)
        .query({ passphrase: '/swift_fox_42' });

      // then
      expect(response.status).toBe(400);
    });

    it('spends a passphrase on its first read', async () => {
      // given
      const owner = await bootstrap.utils.generalUtils.setupAnonymous();
      const other = await bootstrap.utils.generalUtils.setupAnonymous();
      const passphrase = '/wise_raven_abcdefabcdefabcd';
      await sendUpdate(passphrase);

      await request(bootstrap.app.getHttpServer())
        .get('/notification_channel_setup/telegram/chat_info')
        .set('Authorization', `Bearer ${owner.token}`)
        .query({ passphrase })
        .expect(200, { success: true, chatId: '123456789', name: 'Victim' });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get('/notification_channel_setup/telegram/chat_info')
        .set('Authorization', `Bearer ${other.token}`)
        .query({ passphrase });

      // then
      expect(response.body).toEqual({ success: false });
    });

    it('no longer sends arbitrary messages through the bot', async () => {
      // given
      const { token } = await bootstrap.utils.generalUtils.setupAnonymous();

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .post('/notification_channel_setup/telegram/send_test_message')
        .set('Authorization', `Bearer ${token}`)
        .send({
          chatId: '123456789',
          message: 'Your account is suspended, log in at evil.example',
        });

      // then
      expect(response.status).toBe(404);
    });
  });
});
