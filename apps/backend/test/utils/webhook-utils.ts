import { INestApplication } from '@nestjs/common';
import * as nock from 'nock';
import { WebhookHttpMethod } from '../../src/notification-channel/core/types/webhook-options.type';

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

  public setUpWebhookListenerWithMethod(dto: {
    webhookUrl: string;
    method: WebhookHttpMethod;
    onMessage: (body: any, headers?: any) => void;
  }) {
    const url = new URL(dto.webhookUrl);

    switch (dto.method) {
      case WebhookHttpMethod.POST:
        nock(`${url.protocol}//${url.host}`)
          .post(url.pathname)
          .reply(function (uri, body) {
            dto.onMessage(body, this.req.headers);
            return true;
          })
          .persist();
        break;
      case WebhookHttpMethod.GET:
        nock(`${url.protocol}//${url.host}`)
          .get(url.pathname)
          .reply(function (uri, body) {
            dto.onMessage(body, this.req.headers);
            return true;
          })
          .persist();
        break;
      case WebhookHttpMethod.PUT:
        nock(`${url.protocol}//${url.host}`)
          .put(url.pathname)
          .reply(function (uri, body) {
            dto.onMessage(body, this.req.headers);
            return true;
          })
          .persist();
        break;
      case WebhookHttpMethod.DELETE:
        nock(`${url.protocol}//${url.host}`)
          .delete(url.pathname)
          .reply(function (uri, body) {
            dto.onMessage(body, this.req.headers);
            return true;
          })
          .persist();
        break;
      case WebhookHttpMethod.PATCH:
        nock(`${url.protocol}//${url.host}`)
          .patch(url.pathname)
          .reply(function (uri, body) {
            dto.onMessage(body, this.req.headers);
            return true;
          })
          .persist();
        break;
      case WebhookHttpMethod.OPTIONS:
        nock(`${url.protocol}//${url.host}`)
          .options(url.pathname)
          .reply(function (uri, body) {
            dto.onMessage(body, this.req.headers);
            return true;
          })
          .persist();
        break;
      case WebhookHttpMethod.HEAD:
        nock(`${url.protocol}//${url.host}`)
          .head(url.pathname)
          .reply(function (uri, body) {
            dto.onMessage(body, this.req.headers);
            return true;
          })
          .persist();
        break;
      default:
        throw new Error(`Unsupported HTTP method: ${dto.method}`);
    }
  }
}
