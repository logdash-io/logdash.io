import * as request from 'supertest';
import { createTestApp } from '../../utils/bootstrap';
import { getEnvConfig } from '../../../src/shared/configs/env-configs';
import { TelegramUpdateDto } from '../../../src/notification-channel/setup/telegram/dto/telegram-update.dto';

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

  it('gets private chat info', async () => {
    const { token } = await bootstrap.utils.generalUtils.setupAnonymous();

    // given
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

    // when - send webhook update
    const webhookResponse = await request(bootstrap.app.getHttpServer())
      .post('/notification_channel_setup/telegram/bot_webhook')
      .set('X-Telegram-Bot-Api-Secret-Token', validTelegramSecret)
      .send(telegramUpdate);

    // then - webhook should be processed successfully
    expect(webhookResponse.status).toBe(201);

    // when - fetch chat info using passphrase
    const chatInfoResponse = await request(bootstrap.app.getHttpServer())
      .get('/notification_channel_setup/telegram/chat_info')
      .set('Authorization', `Bearer ${token}`)
      .query({ passphrase: '/private-test-phrase' });

    // then - should return correct chat info
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

    // when - send webhook update for group chat
    const webhookResponse = await request(bootstrap.app.getHttpServer())
      .post('/notification_channel_setup/telegram/bot_webhook')
      .set('X-Telegram-Bot-Api-Secret-Token', validTelegramSecret)
      .send(telegramUpdate);

    // then - webhook should be processed successfully
    expect(webhookResponse.status).toBe(201);

    // when - fetch chat info
    const chatInfoResponse = await request(bootstrap.app.getHttpServer())
      .get('/notification_channel_setup/telegram/chat_info')
      .set('Authorization', `Bearer ${token}`)
      .query({ passphrase: groupPassphrase });

    // then - should return group chat info
    expect(chatInfoResponse.status).toBe(200);
    expect(chatInfoResponse.body).toEqual({
      success: true,
      chatId: '987654321',
      name: 'Dev Team Group',
    });
  });

  it('rejects webhook update with invalid secret', async () => {
    const { token } = await bootstrap.utils.generalUtils.setupAnonymous();

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

    // when - send webhook update with invalid secret
    await request(bootstrap.app.getHttpServer())
      .post('/notification_channel_setup/telegram/bot_webhook')
      .set('X-Telegram-Bot-Api-Secret-Token', 'invalid-secret')
      .send(telegramUpdate);

    // then - chat info should not be stored
    const chatInfoResponse = await request(bootstrap.app.getHttpServer())
      .get('/notification_channel_setup/telegram/chat_info')
      .set('Authorization', `Bearer ${token}`)
      .query({ passphrase: 'invalid-secret-test' });

    expect(chatInfoResponse.status).toBe(200);
    expect(chatInfoResponse.body).toEqual({
      success: false,
    });
  });

  it('rejects webhook update with invalid passphrase', async () => {
    const { token } = await bootstrap.utils.generalUtils.setupAnonymous();

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
        text: 'invalid-passphrase-test', // invalid because it doesn't start with '/'
      },
    };

    // when - send webhook update with invalid passphrase
    await request(bootstrap.app.getHttpServer())
      .post('/notification_channel_setup/telegram/bot_webhook')
      .set('X-Telegram-Bot-Api-Secret-Token', validTelegramSecret)
      .send(telegramUpdate);

    // then - chat info should not be stored
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
