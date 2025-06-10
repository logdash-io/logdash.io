import { INestApplication } from '@nestjs/common';
import * as nock from 'nock';

export class WebhookUtils {
  constructor(private readonly app: INestApplication<any>) {}

  public setUpWebhookListener(dto: {
    url: string;
    onMessage: (body: any) => void;
    method?: string;
  }) {
    const urlObj = new URL(dto.url);
    const method = dto.method || 'POST';

    nock(urlObj.origin)
      [method.toLowerCase()](urlObj.pathname + urlObj.search, (body) => {
        dto.onMessage(body);
        return true;
      })
      .reply(200, {
        success: true,
      })
      .persist();
  }
}
