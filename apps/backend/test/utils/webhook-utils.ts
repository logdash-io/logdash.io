import { INestApplication } from '@nestjs/common';
import * as nock from 'nock';

export class WebhookUtils {
  constructor(private readonly app: INestApplication<any>) {}

  public setUpWebhookListener(dto: {
    webhookUrl: string;
    onMessage: (body: any, headers?: any) => void;
  }) {
    const url = new URL(dto.webhookUrl);

    nock(`${url.protocol}//${url.host}`)
      .post(url.pathname)
      .reply(function (uri, body) {
        dto.onMessage(body, this.req.headers);
        return true;
      })
      .persist();
  }
}
