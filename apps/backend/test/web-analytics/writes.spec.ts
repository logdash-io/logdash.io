import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { advanceBy, advanceTo } from 'jest-date-mock';
import { createTestApp } from '../utils/bootstrap';
import { WebAnalyticsIngestionService } from '../../src/web-analytics/ingestion/web-analytics-ingestion.service';
import { WebAnalyticsWriteService } from '../../src/web-analytics/write/web-analytics-write.service';
import {
  CollectWebEventsBody,
  WebEventBody,
} from '../../src/web-analytics/core/dto/collect-web-events.body';
import { WebAnalyticsSiteSerialized } from '../../src/web-analytics/core/entities/web-analytics-site.interface';
import { RedisService } from '../../src/shared/redis/redis.service';
import { ClusterRemovalService } from '../../src/cluster/removal/cluster-removal.service';
import { ClusterPlanConfigs } from '../../src/shared/configs/cluster-plan-configs';
import { ClusterTier } from '../../src/cluster/core/enums/cluster-tier.enum';
import { WebEventClickhouseEntity } from '../../src/web-analytics/core/entities/web-event.clickhouse-entity';
import { LoggerMock } from '../utils/logger-mock';

describe('Web analytics (writes)', () => {
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;
  const origin = 'https://example.com';

  beforeAll(async () => {
    bootstrap = await createTestApp();
  });
  beforeEach(async () => {
    await bootstrap.methods.beforeEach();
    advanceTo('2026-10-02T12:00:00Z');
  });
  afterAll(async () => {
    await bootstrap.methods.afterAll();
  });

  describe('PUT /clusters/:clusterId/web_analytics/site', () => {
    it('configures one stable public site per domain and updates origins', async () => {
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();
      const site = await configure(setup.cluster.id, setup.token);
      const updated = await request(bootstrap.app.getHttpServer())
        .put(`/clusters/${setup.cluster.id}/web_analytics/site`)
        .set('Authorization', `Bearer ${setup.token}`)
        .send({ origins: ['https://other.example', 'http://localhost:3000'] });
      expect(updated.status).toBe(200);
      expect((updated.body as WebAnalyticsSiteSerialized).id).toBe(site.id);
      expect(await bootstrap.models.webAnalyticsSiteModel.countDocuments()).toBe(1);
      expect(await bootstrap.models.webAnalyticsSiteModel.findOne().lean()).toMatchObject({
        clusterId: setup.cluster.id,
        origins: ['https://other.example', 'http://localhost:3000'],
      });
    });

    it('requires a session and rejects users from another cluster', async () => {
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();
      const stranger = await bootstrap.utils.generalUtils.setupAnonymous();
      const path = `/clusters/${setup.cluster.id}/web_analytics/site`;
      expect(
        (
          await request(bootstrap.app.getHttpServer())
            .put(path)
            .send({ origins: [origin] })
        ).status,
      ).toBe(401);
      expect(
        (
          await request(bootstrap.app.getHttpServer())
            .put(path)
            .set('Authorization', `Bearer ${stranger.token}`)
            .send({ origins: [origin] })
        ).status,
      ).toBe(403);
    });

    it('rejects insecure remote sites and origins with credentials or paths', async () => {
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();
      for (const invalid of [
        'http://example.com',
        'https://user:password@example.com',
        'https://example.com/path',
      ]) {
        const response = await request(bootstrap.app.getHttpServer())
          .put(`/clusters/${setup.cluster.id}/web_analytics/site`)
          .set('Authorization', `Bearer ${setup.token}`)
          .send({ origins: [invalid] });
        expect(response.status).toBe(400);
      }
    });
  });

  describe('POST /web_events', () => {
    it('queues events durably, hashes site-scoped identities and removes sensitive URL data', async () => {
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();
      const site = await configure(setup.cluster.id, setup.token);
      const body = batch(site.id, [
        event({
          path: '/people/alice%40example.com/12345?token=secret#fragment',
          referrer: 'news.example',
          utmSource: 'newsletter',
          utmCampaign: 'alice@example.com',
          utmTerm: 'logs',
          timezone: 'Europe/Warsaw',
        }),
      ]);
      expect((await collect(body)).status).toBe(202);
      const redis = bootstrap.app.get(RedisService);
      expect(await redis.getClient().lLen('web-analytics:queue')).toBe(1);
      await bootstrap.app.get(WebAnalyticsIngestionService).processQueue();
      const result = await bootstrap.clickhouseClient.query({
        query: 'SELECT * FROM web_events FINAL',
      });
      const { data } = await result.json<Record<string, string>>();
      expect(data).toHaveLength(1);
      expect(data[0]).toMatchObject({
        cluster_id: setup.cluster.id,
        path: '/people/:redacted/:id',
        referrer: 'news.example',
        utm_source: 'newsletter',
        utm_campaign: '',
        utm_term: 'logs',
        device: 'Desktop',
        browser: 'Chrome',
        os: 'Windows',
        country: 'PL',
      });
      expect(data[0].visitor_id).toHaveLength(64);
      expect(data[0].visitor_id).not.toBe(body.events[0].visitorId);
      expect(await redis.getClient().lLen('web-analytics:queue')).toBe(0);
    });

    it('accepts any browser Origin, records its hostname and requires a known site', async () => {
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();
      const site = await configure(setup.cluster.id, setup.token);
      const body = batch(site.id);
      expect((await collect(body, 'https://preview.example.dev')).status).toBe(202);
      await bootstrap.app.get(WebAnalyticsIngestionService).processQueue();
      const result = await bootstrap.clickhouseClient.query({
        query: 'SELECT hostname FROM web_events FINAL',
      });
      expect((await result.json<{ hostname: string }>()).data).toEqual([
        { hostname: 'preview.example.dev' },
      ]);
      expect(
        (await request(bootstrap.app.getHttpServer()).post('/web_events').send(body)).status,
      ).toBe(403);
      for (const invalid of ['null', 'file://', 'chrome-extension://abc', 'https://a.example/path'])
        expect((await collect(body, invalid)).status).toBe(403);
      expect((await collect({ ...body, siteId: '000000000000000000000000' })).status).toBe(403);
    });

    it('accepts plain-text JSON so a cross-origin script sends without a preflight', async () => {
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();
      const site = await configure(setup.cluster.id, setup.token);
      const response = await request(bootstrap.app.getHttpServer())
        .post('/web_events')
        .set('Origin', origin)
        .set('Content-Type', 'text/plain')
        .send(JSON.stringify(batch(site.id)));
      expect(response.status).toBe(202);
      expect(await bootstrap.app.get(RedisService).getClient().lLen('web-analytics:queue')).toBe(1);
      const malformed = await request(bootstrap.app.getHttpServer())
        .post('/web_events')
        .set('Origin', origin)
        .set('Content-Type', 'text/plain')
        .send('{not json');
      expect(malformed.status).toBe(400);
    });

    it('rejects identity linking and arbitrary properties and filters bots', async () => {
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();
      const site = await configure(setup.cluster.id, setup.token);
      expect(
        (
          await collect(
            batch(site.id, [
              { ...event(), userId: 'user-123', properties: { email: 'alice@example.com' } },
            ]),
          )
        ).status,
      ).toBe(400);
      for (const bot of ['Googlebot', 'Mediapartners-Google', 'facebookexternalhit/1.1']) {
        const response = await request(bootstrap.app.getHttpServer())
          .post('/web_events')
          .set('Origin', origin)
          .set('User-Agent', bot)
          .send(batch(site.id));
        expect(response.status).toBe(202);
      }
      expect(await bootstrap.app.get(RedisService).getClient().lLen('web-analytics:queue')).toBe(0);
      await request(bootstrap.app.getHttpServer())
        .post('/web_events')
        .set('Origin', origin)
        .set('User-Agent', 'Mozilla/5.0 (Linux; Android 11; CUBOT_X30) Chrome/120.0.0.0 Mobile')
        .send(batch(site.id));
      expect(await bootstrap.app.get(RedisService).getClient().lLen('web-analytics:queue')).toBe(1);
    });

    it('keeps the queue on a storage failure and deduplicates an insertion retry', async () => {
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();
      const site = await configure(setup.cluster.id, setup.token);
      await collect(batch(site.id));
      const write = bootstrap.app.get(WebAnalyticsWriteService);
      const insert = write.insertEvents.bind(write);
      const spy = jest.spyOn(write, 'insertEvents').mockImplementationOnce(async (rows) => {
        await insert(rows);
        throw new Error('Connection lost after insertion');
      });
      const ingestion = bootstrap.app.get(WebAnalyticsIngestionService);
      await expect(ingestion.processQueue()).rejects.toThrow('Connection lost');
      spy.mockRestore();
      expect(await bootstrap.app.get(RedisService).getClient().lLen('web-analytics:queue')).toBe(1);
      await ingestion.processQueue();
      const result = await bootstrap.clickhouseClient.query({
        query: 'SELECT count() AS count FROM web_events FINAL',
      });
      expect(Number((await result.json<{ count: string }>()).data[0].count)).toBe(1);
    });

    it('corrects the clock of a client that runs two hours ahead', async () => {
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();
      const site = await configure(setup.cluster.id, setup.token);
      const clientNow = Date.now() + 2 * 3_600_000;
      const at = (offset: number): string => new Date(clientNow + offset).toISOString();
      const body = batch(
        site.id,
        [
          event({ timestamp: at(-10_000), visitorStartedAt: at(-3_600_000) }),
          event({ timestamp: at(-5_000), visitorStartedAt: at(60_000) }),
          event({ timestamp: at(-5_000), visitorStartedAt: '2010-01-01T00:00:00Z' }),
        ],
        at(0),
      );
      expect((await collect(body)).status).toBe(202);
      await bootstrap.app.get(WebAnalyticsIngestionService).processQueue();
      const result = await bootstrap.clickhouseClient.query({
        query:
          'SELECT created_at, visitor_started_at FROM web_events FINAL ORDER BY created_at, visitor_started_at',
      });
      expect((await result.json<Record<string, string>>()).data).toEqual([
        { created_at: '2026-10-02 11:59:50.000', visitor_started_at: '2026-10-02 11:00:00.000' },
        { created_at: '2026-10-02 11:59:55.000', visitor_started_at: '2020-01-01 00:00:00.000' },
        { created_at: '2026-10-02 11:59:55.000', visitor_started_at: '2026-10-02 11:59:55.000' },
      ]);
    });

    it('drops events older than five minutes at send time and stores the rest', async () => {
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();
      const site = await configure(setup.cluster.id, setup.token);
      const stale = new Date(Date.now() - 6 * 60_000).toISOString();
      const fresh = event();
      const response = await collect(
        batch(site.id, [event({ timestamp: stale, visitorStartedAt: stale }), fresh]),
      );
      expect(response.status).toBe(202);
      await bootstrap.app.get(WebAnalyticsIngestionService).processQueue();
      const result = await bootstrap.clickhouseClient.query({
        query: 'SELECT toString(id) AS id FROM web_events FINAL',
      });
      expect((await result.json<{ id: string }>()).data).toEqual([{ id: fresh.id }]);
      expect(
        (await collect(batch(site.id, [event({ timestamp: stale, visitorStartedAt: stale })])))
          .status,
      ).toBe(202);
      expect(await bootstrap.app.get(RedisService).getClient().lLen('web-analytics:queue')).toBe(0);
      expect(
        await bootstrap.app
          .get(RedisService)
          .get(`web-analytics:usage:${setup.cluster.id}:2026-10-02T12`),
      ).toBe('1');
    });

    it('stores one row for an event resent with a slightly different send time', async () => {
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();
      const site = await configure(setup.cluster.id, setup.token);
      const resent = event();
      const ingestion = bootstrap.app.get(WebAnalyticsIngestionService);
      const queuedCreatedAt = async (): Promise<string> => {
        const [entry] = await bootstrap.app
          .get(RedisService)
          .getClient()
          .lRange('web-analytics:queue', 0, 0);
        return (JSON.parse(entry) as WebEventClickhouseEntity).created_at;
      };
      expect((await collect(batch(site.id, [resent]))).status).toBe(202);
      expect(await queuedCreatedAt()).toBe('2026-10-02 12:00:00.000');
      await ingestion.processQueue();
      advanceBy(5_000);
      const sentAt = new Date(Date.now() + 400).toISOString();
      expect((await collect(batch(site.id, [resent], sentAt))).status).toBe(202);
      expect(await queuedCreatedAt()).toBe('2026-10-02 11:59:59.600');
      await ingestion.processQueue();
      const result = await bootstrap.clickhouseClient.query({
        query: 'SELECT count() AS count FROM web_events FINAL',
      });
      expect(Number((await result.json<{ count: string }>()).data[0].count)).toBe(1);
    });

    it('applies the separate event quota', async () => {
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();
      const site = await configure(setup.cluster.id, setup.token);
      await bootstrap.app
        .get(RedisService)
        .set(
          `web-analytics:usage:${setup.cluster.id}:2026-10-02T12`,
          String(ClusterPlanConfigs[ClusterTier.Free].webAnalytics.rateLimitPerHour),
          3600,
        );
      expect((await collect(batch(site.id))).status).toBe(429);
    });

    it('stores known click id names and sanitizes campaign values', async () => {
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();
      const site = await configure(setup.cluster.id, setup.token);
      const tagged = event({
        clickId: 'gclid',
        utmSource: 'spring+sale',
        utmMedium: 'über',
        utmCampaign: 'bob@example.com',
        utmTerm: `  ${'x'.repeat(150)}  `,
      });
      const unknown = event({
        clickId: 'yclid',
        utmSource: 'line\nbreak',
        utmMedium: `${'x'.repeat(99)}😀tail`,
      });
      expect((await collect(batch(site.id, [tagged, unknown]))).status).toBe(202);
      await bootstrap.app.get(WebAnalyticsIngestionService).processQueue();
      const result = await bootstrap.clickhouseClient.query({
        query:
          'SELECT toString(id) AS id, click_id, utm_source, utm_medium, utm_campaign, utm_term FROM web_events FINAL',
      });
      const { data } = await result.json<Record<string, string>>();
      expect(data.find((row) => row.id === tagged.id)).toEqual({
        id: tagged.id,
        click_id: 'gclid',
        utm_source: 'spring+sale',
        utm_medium: 'über',
        utm_campaign: '',
        utm_term: 'x'.repeat(100),
      });
      expect(data.find((row) => row.id === unknown.id)).toMatchObject({
        click_id: '',
        utm_source: '',
        utm_medium: `${'x'.repeat(99)}😀`,
      });
    });

    it('skips unreadable queued entries and rows ClickHouse rejects without blocking the queue', async () => {
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();
      const site = await configure(setup.cluster.id, setup.token);
      const first = event();
      const last = event();
      await collect(batch(site.id, [first]));
      const client = bootstrap.app.get(RedisService).getClient();
      const [queued] = await client.lRange('web-analytics:queue', 0, 0);
      const rejected: WebEventClickhouseEntity = {
        ...(JSON.parse(queued) as WebEventClickhouseEntity),
        id: randomUUID(),
        cluster_id: 'x'.repeat(30),
      };
      await client.lPush('web-analytics:queue', ['{not json', 'null', JSON.stringify(rejected)]);
      await collect(batch(site.id, [last]));
      const error = jest.spyOn(LoggerMock.prototype, 'error');
      await bootstrap.app.get(WebAnalyticsIngestionService).processQueue();
      const result = await bootstrap.clickhouseClient.query({
        query: 'SELECT toString(id) AS id FROM web_events FINAL',
      });
      const { data } = await result.json<{ id: string }>();
      expect(data.map((row) => row.id).sort()).toEqual([first.id, last.id].sort());
      expect(await client.lLen('web-analytics:queue')).toBe(0);
      expect(error).toHaveBeenCalledWith('ClickHouse skipped unreadable web events', {
        skipped: 1,
      });
      expect(error).toHaveBeenCalledWith('Skipped unreadable queued web event', {
        sample: '{not json',
      });
      error.mockRestore();
    });

    it('removes website data with its domain, including buffered events', async () => {
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();
      const site = await configure(setup.cluster.id, setup.token);
      await collect(batch(site.id));
      await bootstrap.app.get(WebAnalyticsIngestionService).processQueue();
      await collect(batch(site.id));
      await bootstrap.app
        .get(ClusterRemovalService)
        .deleteClusterById(setup.cluster.id, setup.user.id);
      await bootstrap.app.get(WebAnalyticsIngestionService).processQueue();
      expect(await bootstrap.models.webAnalyticsSiteModel.countDocuments()).toBe(0);
      const result = await bootstrap.clickhouseClient.query({
        query: 'SELECT count() AS count FROM web_events FINAL',
      });
      expect(Number((await result.json<{ count: string }>()).data[0].count)).toBe(0);
      expect((await collect(batch(site.id))).status).toBe(403);
    });

    it('waits for an in-flight batch before deleting a domain', async () => {
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();
      const site = await configure(setup.cluster.id, setup.token);
      await collect(batch(site.id));
      let entered: () => void = () => undefined;
      let finish: () => void = () => undefined;
      const inserting = new Promise<void>((resolve) => {
        entered = resolve;
      });
      const resume = new Promise<void>((resolve) => {
        finish = resolve;
      });
      const write = bootstrap.app.get(WebAnalyticsWriteService);
      const insert = write.insertEvents.bind(write);
      const spy = jest.spyOn(write, 'insertEvents').mockImplementationOnce(async (rows) => {
        entered();
        await resume;
        return insert(rows);
      });
      const flushing = bootstrap.app.get(WebAnalyticsIngestionService).processQueue();
      await inserting;
      const deleting = bootstrap.app
        .get(ClusterRemovalService)
        .deleteClusterById(setup.cluster.id, setup.user.id);
      const existing = await bootstrap.models.clusterModel.findById(setup.cluster.id).lean();
      finish();
      await Promise.all([flushing, deleting]);
      spy.mockRestore();
      expect(existing).not.toBeNull();
      expect(await bootstrap.models.webAnalyticsSiteModel.countDocuments()).toBe(0);
      const result = await bootstrap.clickhouseClient.query({
        query: 'SELECT count() AS count FROM web_events FINAL',
      });
      expect(Number((await result.json<{ count: string }>()).data[0].count)).toBe(0);
    });
  });

  async function configure(clusterId: string, token: string): Promise<WebAnalyticsSiteSerialized> {
    const response = await request(bootstrap.app.getHttpServer())
      .put(`/clusters/${clusterId}/web_analytics/site`)
      .set('Authorization', `Bearer ${token}`)
      .send({ origins: [origin] });
    expect(response.status).toBe(200);
    return response.body as WebAnalyticsSiteSerialized;
  }

  function batch(
    siteId: string,
    events: object[] = [event()],
    sentAt = new Date().toISOString(),
  ): CollectWebEventsBody {
    return { siteId, sentAt, events: events as WebEventBody[] };
  }

  function event(overrides: Partial<WebEventBody> = {}): WebEventBody {
    return {
      id: randomUUID(),
      visitorId: randomUUID(),
      sessionId: randomUUID(),
      visitorStartedAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      name: 'pageview',
      path: '/',
      ...overrides,
    };
  }

  function collect(body: object, from = origin): request.Test {
    return request(bootstrap.app.getHttpServer())
      .post('/web_events')
      .set('Origin', from)
      .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0.0.0 Safari/537.36')
      .send(body);
  }
});
