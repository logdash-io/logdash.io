import request from 'supertest';
import nock from 'nock';
import { createTestApp } from '../utils/bootstrap';
import { getEnvConfig } from '../../src/shared/configs/env-configs';
import { TelegramSendMessageBody } from '../utils/telegram-utils';

describe('FeedbackController (writes)', () => {
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;
  const botToken = 'internal-token';
  const originalBotToken = getEnvConfig().internal.telegram.botToken;

  beforeAll(async () => {
    bootstrap = await createTestApp();
    getEnvConfig().internal.telegram.botToken = botToken;
  });

  beforeEach(async () => {
    await bootstrap.methods.beforeEach();
  });

  afterAll(async () => {
    getEnvConfig().internal.telegram.botToken = originalBotToken;
    await bootstrap.methods.afterAll();
  });

  const listenForTeamMessages = (): TelegramSendMessageBody[] => {
    const messages: TelegramSendMessageBody[] = [];

    bootstrap.utils.telegramUtils.setUpTelegramSendMessageListener({
      botId: botToken,
      onMessage: (body) => messages.push(body),
    });

    return messages;
  };

  it('posts feedback to the team chat with a masked email', async () => {
    // given
    const { token } = await bootstrap.utils.generalUtils.setupClaimed({
      email: 'john.doe@gmail.com',
    });
    const messages = listenForTeamMessages();

    // when
    const response = await request(bootstrap.app.getHttpServer())
      .post('/feedback')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: '  More charts (please)!  ', rating: 4 });

    // then
    expect(response.status).toBe(204);
    expect(messages).toEqual([
      {
        chat_id: getEnvConfig().internal.telegram.chatId,
        text: '💬 Feedback ★★★★☆ from jo\\*\\*\\*@gm\\*\\*\\*\\.com\n\nMore charts \\(please\\)\\!',
      },
    ]);
  });

  it('names an anonymous sender as such', async () => {
    // given
    const { token } = await bootstrap.utils.generalUtils.setupAnonymous();
    const messages = listenForTeamMessages();

    // when
    const response = await request(bootstrap.app.getHttpServer())
      .post('/feedback')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'nice', rating: 5 });

    // then
    expect(response.status).toBe(204);
    expect(messages[0].text).toBe('💬 Feedback ★★★★★ from an anonymous user\n\nnice');
  });

  it('fails instead of dropping feedback the team chat did not get', async () => {
    // given
    const { token } = await bootstrap.utils.generalUtils.setupClaimed();
    nock('https://api.telegram.org').post(`/bot${botToken}/sendMessage`).query(true).reply(500);

    // when
    const response = await request(bootstrap.app.getHttpServer())
      .post('/feedback')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'nice', rating: 5 });

    // then
    expect(response.status).toBe(502);
  });

  it('rejects a request without a session', async () => {
    // when
    const response = await request(bootstrap.app.getHttpServer())
      .post('/feedback')
      .send({ message: 'nice', rating: 5 });

    // then
    expect(response.status).toBe(401);
  });
});
