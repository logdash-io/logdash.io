import request from 'supertest';
import { createHash, randomUUID } from 'node:crypto';
import { advanceBy, advanceTo } from 'jest-date-mock';
import { createTestApp } from '../utils/bootstrap';
import { ClusterIngestKeySerialized } from '../../src/api-key/core/entities/api-key.interface';
import { ClusterRemovalService } from '../../src/cluster/removal/cluster-removal.service';
import { RedisService } from '../../src/shared/redis/redis.service';
import {
  WebAnalyticsEventResponse,
  WebAnalyticsResponse,
  WebAnalyticsVisitorResponse,
} from '../../src/web-analytics/core/dto/web-analytics.response';
import { WebAnalyticsSiteSerialized } from '../../src/web-analytics/core/entities/web-analytics-site.interface';
import { WebEventClickhouseEntity } from '../../src/web-analytics/core/entities/web-event.clickhouse-entity';
import { WebAnalyticsIngestionService } from '../../src/web-analytics/ingestion/web-analytics-ingestion.service';

describe('POST /events', () => {
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;
  const userAgent = 'logdash-node/2.1.0';
  const week = 'from=2026-09-26T00:00:00.000Z&to=2026-10-03T00:00:00.000Z';

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

  it('stores an app event on the domain key with only a hash of the user id, in a site the domain gets on first use', async () => {
    // given
    const setup = await bootstrap.utils.generalUtils.setupAnonymous();
    const key = await domainKey(setup.cluster.id, setup.token);

    // when
    const response = await track(key, {
      name: 'agent_run',
      app: 'desktop',
      userId: 42,
      props: { model: 'opus', tools: 3, contact: 'alice@example.com' },
    });
    await flush();

    // then
    expect(response.status).toBe(202);
    const site = await bootstrap.models.webAnalyticsSiteModel
      .findOne({ clusterId: setup.cluster.id })
      .lean();
    const siteId = site!._id.toString();
    expect(site!.origins).toEqual([]);
    const salt = await bootstrap.app.get(RedisService).get('web-analytics:salt:week:2026-09-28');
    const rows = await stored();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      cluster_id: setup.cluster.id,
      site_id: siteId,
      name: 'agent_run',
      app: 'desktop',
      user_id: sha256(`${siteId}:42`),
      visitor_id: sha256(`${salt}:${siteId}:127.0.0.1:${userAgent}:desktop`),
      hostname: '',
      path: '',
      props: { model: 'opus', tools: '3' },
    });
    expect(JSON.stringify(rows[0])).not.toContain('"42"');
  });

  it('names the app after the service on a service key and calls it default on a domain key without one', async () => {
    // given
    const setup = await bootstrap.utils.generalUtils.setupAnonymous();
    const key = await domainKey(setup.cluster.id, setup.token);

    // when
    const responses = [
      await track(setup.apiKey.value, { name: 'signup_completed', app: 'ignored' }),
      await track(key, { name: 'signup_completed' }),
    ];
    await flush();

    // then
    expect(responses.map(({ status }) => status)).toEqual([202, 202]);
    expect((await stored()).map(({ app }) => app).sort()).toEqual(
      ['default', setup.project.name].sort(),
    );
  });

  it('rejects unknown keys, website event names and user ids that are email addresses', async () => {
    // given
    const setup = await bootstrap.utils.generalUtils.setupAnonymous();
    const key = await domainKey(setup.cluster.id, setup.token);

    // when
    const statuses = [
      (await track('ldi_unknown', { name: 'agent_run' })).status,
      (await track(key, { name: 'pageview' })).status,
      (await track(key, { name: 'Agent run' })).status,
      (await track(key, { name: 'agent_run', userId: 'alice@example.com' })).status,
      (await track(key, { name: 'agent_run', userId: true })).status,
    ];
    await flush();

    // then
    expect(statuses).toEqual([401, 400, 400, 400, 400]);
    expect(await stored()).toEqual([]);
  });

  it('stores a retried event once', async () => {
    // given
    const setup = await bootstrap.utils.generalUtils.setupAnonymous();
    const key = await domainKey(setup.cluster.id, setup.token);
    const id = randomUUID();

    // when
    await track(key, { id, name: 'agent_run', app: 'desktop' });
    await track(key, { id, name: 'agent_run', app: 'desktop' });
    await flush();

    // then
    expect((await stored()).map((row) => row.id)).toEqual([id]);
  });

  it('connects the website and apps only through user ids', async () => {
    // given
    const setup = await bootstrap.utils.generalUtils.setupAnonymous();
    const key = await domainKey(setup.cluster.id, setup.token);
    const site = await configure(setup.cluster.id, setup.token);
    await request(bootstrap.app.getHttpServer())
      .post('/web_events')
      .set('Origin', 'https://example.com')
      .set('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Chrome/130.0.0.0')
      .send({
        siteId: site.id,
        sentAt: new Date().toISOString(),
        events: [
          {
            id: randomUUID(),
            timestamp: new Date().toISOString(),
            name: 'pageview',
            path: '/',
            userId: sha256(`${site.id}:7`),
          },
        ],
      });
    advanceBy(1000);
    await track(key, { name: 'agent_run', app: 'desktop', userId: '7' });
    await track(key, { name: 'agent_run', app: 'desktop' });
    await track(key, { name: 'clip_made', app: 'grip' });
    await flush();
    advanceBy(1000);

    // when
    const all = (await report(setup.cluster.id, setup.token, `?${week}`))
      .body as WebAnalyticsResponse;
    const desktop = (await report(setup.cluster.id, setup.token, `?${week}&filter=app:desktop`))
      .body as WebAnalyticsResponse;
    const runs = (await report(setup.cluster.id, setup.token, `/events/agent_run?${week}`))
      .body as WebAnalyticsEventResponse;
    const person = (
      await report(setup.cluster.id, setup.token, `/visitors/${sha256(`${site.id}:7`)}`)
    ).body as WebAnalyticsVisitorResponse;

    // then
    expect(all.summary).toMatchObject({ visitors: 3, people: 1, pageviews: 1 });
    expect(all.apps).toEqual([
      { name: 'desktop', website: false, visitors: 2, people: 1, count: 2 },
      { name: 'example.com', website: true, visitors: 1, people: 1, count: 1 },
      { name: 'grip', website: false, visitors: 1, people: 0, count: 1 },
    ]);
    expect(desktop.apps).toEqual([
      { name: 'desktop', website: false, visitors: 2, people: 1, count: 2 },
      { name: 'example.com', website: true, visitors: 1, people: 1, count: 1 },
    ]);
    expect(desktop.summary).toMatchObject({ visitors: 2, people: 1, pageviews: 1 });
    expect(runs.summary).toEqual({
      count: 2,
      visitors: 2,
      people: 1,
      conversionRate: (2 / 3) * 100,
    });
    expect(runs.series.at(-1)).toMatchObject({ count: 2, visitors: 2, people: 1 });
    expect(person.events.map(({ name, app }) => ({ name, app }))).toEqual([
      { name: 'agent_run', app: 'desktop' },
      { name: 'pageview', app: '' },
    ]);
    expect(person.visitor).toMatchObject({
      apps: ['desktop'],
      device: 'Desktop',
      os: 'macOS',
      browser: 'Chrome',
      source: 'Direct',
    });
  });

  it('neither drops nor geolocates app events, because they come from your servers', async () => {
    // given
    const setup = await bootstrap.utils.generalUtils.setupAnonymous();
    const key = await domainKey(setup.cluster.id, setup.token);
    bootstrap.utils.webAnalyticsGeoUtils.reset();
    await bootstrap.utils.webAnalyticsGeoUtils.refresh('2026-10');

    // when
    const response = await track(key, { name: 'agent_run', app: 'desktop' }).set(
      'X-Forwarded-For',
      '67.43.156.1',
    );
    await flush();

    // then
    expect(response.status).toBe(202);
    expect((await stored()).map((row) => [row.name, row.country])).toEqual([['agent_run', '']]);
  });

  it('deletes app events with their domain, and the site the domain got from them', async () => {
    // given
    const setup = await bootstrap.utils.generalUtils.setupAnonymous();
    const key = await domainKey(setup.cluster.id, setup.token);
    await track(key, { name: 'agent_run', app: 'desktop' });
    await flush();

    // when
    await bootstrap.app
      .get(ClusterRemovalService)
      .deleteClusterById(setup.cluster.id, setup.user.id);
    await flush();

    // then
    expect(await bootstrap.models.webAnalyticsSiteModel.countDocuments()).toBe(0);
    expect(await stored()).toEqual([]);
  });

  async function domainKey(clusterId: string, token: string): Promise<string> {
    const response = await request(bootstrap.app.getHttpServer())
      .get(`/clusters/${clusterId}/ingest-key`)
      .set('Authorization', `Bearer ${token}`);
    return (response.body as ClusterIngestKeySerialized).value;
  }

  async function configure(clusterId: string, token: string): Promise<WebAnalyticsSiteSerialized> {
    const response = await request(bootstrap.app.getHttpServer())
      .put(`/clusters/${clusterId}/web_analytics/site`)
      .set('Authorization', `Bearer ${token}`)
      .send({ origins: ['https://example.com'] });
    return response.body as WebAnalyticsSiteSerialized;
  }

  function track(key: string, body: object): request.Test {
    return request(bootstrap.app.getHttpServer())
      .post('/events')
      .set('project-api-key', key)
      .set('User-Agent', userAgent)
      .send(body);
  }

  function report(clusterId: string, token: string, suffix: string): request.Test {
    return request(bootstrap.app.getHttpServer())
      .get(`/clusters/${clusterId}/web_analytics${suffix}`)
      .set('Authorization', `Bearer ${token}`);
  }

  async function flush(): Promise<void> {
    await bootstrap.app.get(WebAnalyticsIngestionService).processQueue();
  }

  async function stored(): Promise<WebEventClickhouseEntity[]> {
    const result = await bootstrap.clickhouseClient.query({
      query: 'SELECT * FROM web_events FINAL ORDER BY created_at',
    });
    return (await result.json<WebEventClickhouseEntity>()).data;
  }

  function sha256(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }
});
