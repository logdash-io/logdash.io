import { App } from 'supertest/types';
import { INestApplication } from '@nestjs/common';
import * as nock from 'nock';

export type TelegramSendMessageBody = { chat_id: string; text: string };

export class TelegramUtils {
  constructor(private readonly app: INestApplication<App>) {}

  /**
   * Creating a telegram channel fires a welcome message at the real telegram
   * api. Tests that are not about that message still have to intercept it,
   * otherwise nock raises an unhandled error mid-test. Matches on the welcome
   * text only, so a later, more specific listener still sees alert messages.
   */
  public suppressWelcomeMessages(): void {
    nock('https://api.telegram.org')
      .post(
        /\/bot.+\/sendMessage/,
        (body: Partial<TelegramSendMessageBody> | undefined) =>
          typeof body?.text === 'string' && body.text.includes('Setup was completed successfully'),
      )
      .query(true)
      .reply(200, { ok: true, result: { message_id: 1 } })
      .persist();
  }

  public setUpTelegramSendMessageListener(dto: {
    botId: string;
    onMessage: (message: TelegramSendMessageBody) => void;
  }): void {
    nock('https://api.telegram.org')
      .post(
        `/bot${dto.botId}/sendMessage?parse_mode=MarkdownV2`,
        (body: TelegramSendMessageBody) => {
          dto.onMessage(body);
          return true;
        },
      )
      .reply(200, {
        ok: true,
        result: {
          message_id: 1,
        },
      })
      .persist();
  }
}
