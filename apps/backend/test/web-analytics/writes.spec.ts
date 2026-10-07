import request from 'supertest';
import { createHash, randomUUID } from 'node:crypto';
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
import { removeKeysWhichWouldExpireInNextXSeconds } from '../utils/redis-test-container-server';

describe('Web analytics (writes)', () => {
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;
  const origin = 'https://example.com';
  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0.0.0 Safari/537.36';

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
      const salt = await redis.get('web-analytics:salt:2026-10-02');
      expect(data[0].visitor_id).toBe(sha256(`${salt}:${site.id}:127.0.0.1:${userAgent}`));
      expect(data[0].session_id).toMatch(/^[0-9a-f]{64}$/);
      expect(data[0].user_id).toBe('');
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

    it('rejects raw user ids and arbitrary properties and filters bots', async () => {
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();
      const site = await configure(setup.cluster.id, setup.token);
      for (const invalid of [
        { userId: 'alice@example.com' },
        { userId: 'user-123' },
        { properties: { email: 'alice@example.com' } },
      ])
        expect((await collect(batch(site.id, [{ ...event(), ...invalid }]))).status).toBe(400);
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

    it('stores custom event props within every limit and keeps events whose props break the rules', async () => {
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();
      const site = await configure(setup.cluster.id, setup.token);
      const start = event({
        name: 'start',
        props: {
          mode: 'zen',
          Bad: 'uppercase key',
          ['k'.repeat(41)]: 'key too long',
          '1st': 'starts with a digit',
          scale: 2,
          stream: true,
          email: 'alice@example.com',
          line: 'line\nbreak',
          nested: { a: 1 },
          list: ['yes'],
          missing: null,
          blank: '   ',
          padded: '  tv  ',
          long: 'x'.repeat(150),
          emoji: `${'x'.repeat(99)}😀tail`,
          k7: '7',
          k8: '8',
          k9: '9',
          k10: '10',
          k11: 'eleventh valid key',
        },
      });
      const pageview = event({ props: { mode: 'zen' } });
      const text = event({ name: 'listen', props: 'remote=yes' });
      const list = event({ name: 'listen', props: ['yes'] });
      const legacy = event({ name: 'legacy' });
      expect((await collect(batch(site.id, [pageview, start, text, list, legacy]))).status).toBe(
        202,
      );
      await bootstrap.app.get(WebAnalyticsIngestionService).processQueue();
      const result = await bootstrap.clickhouseClient.query({
        query: 'SELECT toString(id) AS id, props FROM web_events FINAL',
      });
      const props = new Map(
        (await result.json<{ id: string; props: Record<string, string> }>()).data.map((row) => [
          row.id,
          row.props,
        ]),
      );
      expect(props.get(start.id)).toEqual({
        mode: 'zen',
        scale: '2',
        stream: 'true',
        padded: 'tv',
        long: 'x'.repeat(100),
        emoji: `${'x'.repeat(99)}😀`,
        k7: '7',
        k8: '8',
        k9: '9',
        k10: '10',
      });
      for (const plain of [pageview, text, list, legacy]) expect(props.get(plain.id)).toEqual({});
    });

    it('counts property values past 500 per key as (other) and drops keys past 50 per site, within the retention', async () => {
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();
      const site = await configure(setup.cluster.id, setup.token);
      const start = (props: Record<string, string>): WebEventBody =>
        event({ name: 'start', props });
      for (let page = 0; page < 25; page++)
        expect(
          (
            await collect(
              batch(
                site.id,
                Array.from({ length: 20 }, (_, index) => start({ mode: `m${page * 20 + index}` })),
              ),
            )
          ).status,
        ).toBe(202);
      const keys = Array.from({ length: 49 }, (_, index) => `k${index}`);
      for (let index = 0; index < keys.length; index += 10)
        await collect(
          batch(site.id, [
            start(Object.fromEntries(keys.slice(index, index + 10).map((key) => [key, 'v']))),
          ]),
        );
      await collect(
        batch(site.id, [start({ mode: 'm500', k0: 'v', extra: 'v' }), start({ mode: 'm0' })]),
      );
      advanceBy(91 * 86_400_000);
      await collect(batch(site.id, [start({ mode: 'm501', extra: 'v' })]));
      const rows = (await queued()).slice(-3);
      expect(rows.map((row) => row.props)).toEqual([
        { mode: '(other)', k0: 'v' },
        { mode: 'm0' },
        { mode: 'm501', extra: 'v' },
      ]);
    });

    it('accepts 20 events with full props, rejects bigger batches and plain-text bodies over 32 KB', async () => {
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();
      const site = await configure(setup.cluster.id, setup.token);
      const props = Object.fromEntries(
        Array.from({ length: 10 }, (_, index) => [`k${index}${'x'.repeat(37)}`, '漢'.repeat(100)]),
      );
      const full = (count: number): CollectWebEventsBody =>
        batch(
          site.id,
          Array.from({ length: count }, () => event({ name: 'start', props })),
        );
      expect((await collect(full(20))).status).toBe(202);
      const [queuedRow] = await queued();
      expect(queuedRow.props).toEqual(props);
      expect((await collect(full(21))).status).toBe(400);
      const oversized = await request(bootstrap.app.getHttpServer())
        .post('/web_events')
        .set('Origin', origin)
        .set('Content-Type', 'text/plain')
        .send(JSON.stringify(full(20)));
      expect(oversized.status).toBe(413);
      expect(await bootstrap.app.get(RedisService).getClient().lLen('web-analytics:queue')).toBe(
        20,
      );
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
        [event({ timestamp: at(-10_000) }), event({ timestamp: at(-5_000) })],
        at(0),
      );
      expect((await collect(body)).status).toBe(202);
      await bootstrap.app.get(WebAnalyticsIngestionService).processQueue();
      const result = await bootstrap.clickhouseClient.query({
        query: 'SELECT created_at FROM web_events FINAL ORDER BY created_at',
      });
      expect((await result.json<Record<string, string>>()).data).toEqual([
        { created_at: '2026-10-02 11:59:50.000' },
        { created_at: '2026-10-02 11:59:55.000' },
      ]);
    });

    it('drops events older than five minutes at send time and stores the rest', async () => {
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();
      const site = await configure(setup.cluster.id, setup.token);
      const stale = new Date(Date.now() - 6 * 60_000).toISOString();
      const fresh = event();
      const response = await collect(batch(site.id, [event({ timestamp: stale }), fresh]));
      expect(response.status).toBe(202);
      await bootstrap.app.get(WebAnalyticsIngestionService).processQueue();
      const result = await bootstrap.clickhouseClient.query({
        query: 'SELECT toString(id) AS id FROM web_events FINAL',
      });
      expect((await result.json<{ id: string }>()).data).toEqual([{ id: fresh.id }]);
      expect((await collect(batch(site.id, [event({ timestamp: stale })]))).status).toBe(202);
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
      expect((await collect(batch(site.id, [tagged]))).status).toBe(202);
      await expireSessions();
      expect((await collect(batch(site.id, [unknown]))).status).toBe(202);
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

  describe('POST /web_events identity and sessions', () => {
    it('derives a daily visitor id from a salted hash of IP and user agent and ignores legacy cookie ids', async () => {
      // given
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();
      const site = await configure(setup.cluster.id, setup.token);
      const redis = bootstrap.app.get(RedisService);
      const legacy = (visitorStartedAt: string): WebEventBody =>
        event({ visitorId: randomUUID(), sessionId: randomUUID(), visitorStartedAt });

      // when
      const first = await collect(batch(site.id, [legacy(new Date().toISOString())]));
      const second = await collect(batch(site.id, [legacy('2020-01-01T00:00:00Z')]));
      await request(bootstrap.app.getHttpServer())
        .post('/web_events')
        .set('Origin', origin)
        .set('User-Agent', `${userAgent} Edg/130.0`)
        .send(batch(site.id));
      const salt = await redis.get('web-analytics:salt:2026-10-02');
      const saltTtl = await redis.getClient().ttl('web-analytics:salt:2026-10-02');
      advanceTo('2026-10-03T12:00:00Z');
      await collect(batch(site.id));
      const rows = await queued();

      // then
      expect([first.status, second.status]).toEqual([202, 202]);
      expect(salt).toMatch(/^[0-9a-f]{64}$/);
      expect(saltTtl).toBeGreaterThan(12.5 * 3600 - 10);
      expect(saltTtl).toBeLessThanOrEqual(12.5 * 3600);
      expect(rows[0].visitor_id).toBe(sha256(`${salt}:${site.id}:127.0.0.1:${userAgent}`));
      expect(rows[1]).toMatchObject({
        visitor_id: rows[0].visitor_id,
        session_id: rows[0].session_id,
      });
      expect(rows[2].visitor_id).not.toBe(rows[0].visitor_id);
      expect(rows[3].visitor_id).not.toBe(rows[0].visitor_id);
      expect(await redis.get('web-analytics:salt:2026-10-03')).not.toBe(salt);
    });

    it('uses x-logdash-client-ip when it is an IP address, otherwise the request IP, and stores neither', async () => {
      // given
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();
      const site = await configure(setup.cluster.id, setup.token);
      const redis = bootstrap.app.get(RedisService);

      // when
      for (const clientIp of [
        '',
        'not-an-ip',
        '203.0.113.7, 10.0.0.1',
        '203.0.113.7',
        '2001:db8::1',
      ]) {
        const response = await request(bootstrap.app.getHttpServer())
          .post('/web_events')
          .set('Origin', origin)
          .set('User-Agent', userAgent)
          .set('x-logdash-client-ip', clientIp)
          .send(batch(site.id));
        expect(response.status).toBe(202);
      }
      const rows = await queued();

      // then
      const salt = await redis.get('web-analytics:salt:2026-10-02');
      const visitor = (ip: string): string => sha256(`${salt}:${site.id}:${ip}:${userAgent}`);
      expect(rows.map((row) => row.visitor_id)).toEqual([
        visitor('127.0.0.1'),
        visitor('127.0.0.1'),
        visitor('127.0.0.1'),
        visitor('203.0.113.7'),
        visitor('2001:db8::1'),
      ]);
      const stored = JSON.stringify([rows, await redis.keys('*')]);
      expect(stored).not.toMatch(/127\.0\.0\.1|203\.0\.113\.7|2001:db8/);
    });

    it('keeps the first attribution of a session and starts a new one after 30 idle minutes', async () => {
      // given
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();
      const site = await configure(setup.cluster.id, setup.token);

      // when
      await collect(
        batch(site.id, [
          event({ referrer: 'news.example', utmSource: 'newsletter', clickId: 'gclid' }),
        ]),
      );
      advanceBy(20 * 60_000);
      await collect(batch(site.id, [event({ referrer: 'other.example', path: '/pricing' })]));
      advanceBy(31 * 60_000);
      await expireSessions();
      await collect(batch(site.id, [event({ referrer: 'other.example' })]));
      const rows = await queued();

      // then
      expect(rows[0]).toMatchObject({
        referrer: 'news.example',
        utm_source: 'newsletter',
        click_id: 'gclid',
      });
      expect(rows[1]).toMatchObject({
        visitor_id: rows[0].visitor_id,
        session_id: rows[0].session_id,
        path: '/pricing',
        referrer: 'news.example',
        utm_source: 'newsletter',
        click_id: 'gclid',
      });
      expect(rows[2]).toMatchObject({
        visitor_id: rows[0].visitor_id,
        referrer: 'other.example',
        utm_source: '',
        click_id: '',
      });
      expect(rows[2].session_id).not.toBe(rows[0].session_id);
    });

    it("continues yesterday's session in the first 30 minutes of a UTC day and ends sessions after 24 hours", async () => {
      // given
      advanceTo('2026-10-01T00:05:00Z');
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();
      const site = await configure(setup.cluster.id, setup.token);
      const send = async (at: string, agent = userAgent): Promise<void> => {
        advanceTo(at);
        const response = await request(bootstrap.app.getHttpServer())
          .post('/web_events')
          .set('Origin', origin)
          .set('User-Agent', agent)
          .send(batch(site.id));
        expect(response.status).toBe(202);
      };

      // when
      await send('2026-10-01T00:05:00Z');
      await send('2026-10-02T00:02:00Z');
      await send('2026-10-02T00:03:00Z', `${userAgent} Edg/130.0`);
      await send('2026-10-02T00:06:00Z');
      await send('2026-10-02T00:31:00Z');
      const [started, continued, newcomer, rolled, today] = await queued();

      // then
      const salt = await bootstrap.app.get(RedisService).get('web-analytics:salt:2026-10-02');
      expect(continued).toMatchObject({
        visitor_id: started.visitor_id,
        session_id: started.session_id,
      });
      expect(newcomer.visitor_id).toBe(
        sha256(`${salt}:${site.id}:127.0.0.1:${userAgent} Edg/130.0`),
      );
      expect(rolled.visitor_id).toBe(started.visitor_id);
      expect(rolled.session_id).not.toBe(started.session_id);
      expect(today.visitor_id).toBe(sha256(`${salt}:${site.id}:127.0.0.1:${userAgent}`));
      expect(today.session_id).not.toBe(rolled.session_id);
    });

    it('converges concurrent first requests of one visitor on a single session', async () => {
      // given
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();
      const site = await configure(setup.cluster.id, setup.token);

      // when
      const responses = await Promise.all([
        collect(batch(site.id, [event({ referrer: 'news.example' })])),
        collect(batch(site.id, [event({ name: 'signup_completed' })])),
      ]);
      const rows = await queued();

      // then
      expect(responses.map((response) => response.status)).toEqual([202, 202]);
      expect(rows).toHaveLength(2);
      expect(new Set(rows.map((row) => row.session_id)).size).toBe(1);
      expect(new Set(rows.map((row) => row.visitor_id)).size).toBe(1);
    });

    it('drops a pageleave that has no live session', async () => {
      // given
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();
      const site = await configure(setup.cluster.id, setup.token);
      const view = event();
      const leave = event({ name: 'pageleave' });

      // when
      const orphan = await collect(batch(site.id, [event({ name: 'pageleave' })]));
      const queuedOrphans = await queued();
      await collect(batch(site.id, [event({ name: 'pageleave' }), view, leave]));
      const rows = await queued();

      // then
      expect(orphan.status).toBe(202);
      expect(queuedOrphans).toEqual([]);
      expect(rows.map((row) => row.id)).toEqual([view.id, leave.id]);
      expect(rows[1].session_id).toBe(rows[0].session_id);
    });

    it("stores each event's own hashed user id and never copies it onto anonymous events", async () => {
      // given
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();
      const site = await configure(setup.cluster.id, setup.token);
      const alice = 'a'.repeat(64);

      // when
      await collect(batch(site.id, [event({ userId: alice })]));
      await collect(batch(site.id, [event()]));
      const rows = await queued();
      await bootstrap.app.get(WebAnalyticsIngestionService).processQueue();
      const result = await bootstrap.clickhouseClient.query({
        query: 'SELECT toString(id) AS id, user_id FROM web_events FINAL',
      });
      const userIds = new Map(
        (await result.json<{ id: string; user_id: string }>()).data.map((row) => [
          row.id,
          row.user_id,
        ]),
      );

      // then
      expect(rows[1].session_id).toBe(rows[0].session_id);
      expect(rows.map((row) => userIds.get(row.id))).toEqual([alice, '']);
      const [session] = await bootstrap.app
        .get(RedisService)
        .getClient()
        .mGet([`web-analytics:session:${site.id}:${rows[0].visitor_id}`]);
      expect(session).not.toContain(alice);
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
      .set('User-Agent', userAgent)
      .send(body);
  }

  async function queued(): Promise<WebEventClickhouseEntity[]> {
    const entries = await bootstrap.app
      .get(RedisService)
      .getClient()
      .lRange('web-analytics:queue', 0, -1);
    return entries.map((entry) => JSON.parse(entry) as WebEventClickhouseEntity);
  }

  async function expireSessions(): Promise<void> {
    await removeKeysWhichWouldExpireInNextXSeconds(
      bootstrap.app.get(RedisService).getClient(),
      1800,
    );
  }

  function sha256(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }
});
