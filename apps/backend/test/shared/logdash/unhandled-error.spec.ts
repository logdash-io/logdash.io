import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { APP_LOGGER, LOGDASH_METRICS } from '../../../src/shared/logdash/logdash-tokens';
import { LogdashLogger } from '../../../src/shared/logdash/aggregate-logger';
import { LogdashMetrics } from '../../../src/shared/logdash/aggregate-metrics';
import { WebAnalyticsIngestionService } from '../../../src/web-analytics/ingestion/web-analytics-ingestion.service';
import { createTestApp } from '../../utils/bootstrap';

describe('Unhandled request errors', () => {
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    bootstrap = await createTestApp();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await bootstrap.methods.afterAll();
  });

  const collect = (events: unknown[]): request.Test =>
    request(bootstrap.app.getHttpServer())
      .post('/web_events')
      .set('Origin', 'https://example.com')
      .send({ siteId: '0123456789abcdef01234567', sentAt: new Date().toISOString(), events });

  it('logs the route template and error message, and counts it', async () => {
    // given
    const logError = jest.spyOn(bootstrap.module.get<LogdashLogger>(APP_LOGGER), 'error');
    const mutateMetric = jest.spyOn(
      bootstrap.module.get<LogdashMetrics>(LOGDASH_METRICS),
      'mutateMetric',
    );
    jest
      .spyOn(bootstrap.module.get(WebAnalyticsIngestionService), 'collect')
      .mockRejectedValue(new Error('boom'));
    const now = new Date().toISOString();

    // when
    const response = await collect([
      {
        id: randomUUID(),
        visitorId: randomUUID(),
        sessionId: randomUUID(),
        visitorStartedAt: now,
        timestamp: now,
        name: 'pageview',
        path: '/',
      },
    ]);

    // then
    expect(response.status).toBe(500);
    expect(logError).toHaveBeenCalledWith('Unhandled request error', {
      method: 'POST',
      route: '/web_events',
      error: 'boom',
    });
    expect(mutateMetric).toHaveBeenCalledWith('unhandledErrors', 1);
  });

  it('leaves handled http errors to their own responses', async () => {
    // given
    const logError = jest.spyOn(bootstrap.module.get<LogdashLogger>(APP_LOGGER), 'error');

    // when
    const response = await collect([]);

    // then
    expect(response.status).toBe(400);
    expect(logError).not.toHaveBeenCalled();
  });
});
