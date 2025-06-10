import { INestApplication } from '@nestjs/common';
import * as nock from 'nock';

export class TelegramUtils {
  constructor(private readonly app: INestApplication<any>) {}

  public setUpTelegramSendMessageListener(dto: {
    botId: string;
    onMessage: (message: any) => void;
  }) {
    nock('https://api.telegram.org')
      .post(`/bot${dto.botId}/sendMessage`, (body) => {
        dto.onMessage(body);
        return true;
      })
      .reply(200, {
        ok: true,
        result: {
          message_id: 1,
        },
      })
      .persist();
  }
}
