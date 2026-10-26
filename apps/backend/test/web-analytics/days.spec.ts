import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { advanceTo } from 'jest-date-mock';
import { createTestApp } from '../utils/bootstrap';
import {
  WebAnalyticsDayResponse,
  WebAnalyticsDaysResponse,
  WebAnalyticsDayVisitsResponse,
  WebAnalyticsGoalsResponse,
} from '../../src/web-analytics/core/dto/web-analytics.response';
import { WebEventClickhouseEntity } from '../../src/web-analytics/core/entities/web-event.clickhouse-entity';
import { WebAnalyticsSiteSerialized } from '../../src/web-analytics/core/entities/web-analytics-site.interface';
import { UpdateWebAnalyticsGoalsBody } from '../../src/web-analytics/core/dto/update-web-analytics-goals.body';

describe('Web analytics (days)', () => {
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;
  const goals = 'goal=signup&goal=workspace_created';
  const user = 'b'.repeat(64);
  const eleven = Array.from({ length: 11 }, (_, index) => `goal_${index}`);

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

  it('protects every day read and the goal setting by domain membership', async () => {
    const setup = await bootstrap.utils.generalUtils.setupAnonymous();
    const stranger = await bootstrap.utils.generalUtils.setupAnonymous();
    for (const suffix of ['/days', '/days/2026-10-01', '/days/2026-10-01/visits', '/goals']) {
      const path = `/clusters/${setup.cluster.id}/web_analytics${suffix}`;
      expect((await request(bootstrap.app.getHttpServer()).get(path)).status).toBe(401);
      expect((await get(setup.cluster.id, stranger.token, suffix)).status).toBe(403);
    }
    const update = await request(bootstrap.app.getHttpServer())
      .put(`/clusters/${setup.cluster.id}/web_analytics/goals`)
      .set('Authorization', `Bearer ${stranger.token}`)
      .send({ goals: ['signup'] });
    expect(update.status).toBe(403);
  });

  it('rejects days that are not dates or still to come, and more than 10 or malformed goals', async () => {
    const setup = await bootstrap.utils.generalUtils.setupAnonymous();
    for (const suffix of [
      '/days/2026-02-30',
      '/days/yesterday',
      '/days?date=2026-13-01',
      '/days/2026-10-01/visits?show=bounced',
      `/days/2026-10-01?${eleven.map((goal) => `goal=${goal}`).join('&')}`,
      '/days?goal=Signup',
    ]) {
      expect((await get(setup.cluster.id, setup.token, suffix)).status).toBe(400);
    }
    const future = await get(setup.cluster.id, setup.token, '/days/2026-10-03');
    expect(future.status).toBe(400);
    expect(future.body).toMatchObject({ message: 'Pick a day up to today' });
    const forgotten = await get(setup.cluster.id, setup.token, '/days/2026-06-01/visits');
    expect(forgotten.status).toBe(400);
    expect(forgotten.body).toMatchObject({ message: 'Pick a day within the last 90 days' });
    const oldest = await get(setup.cluster.id, setup.token, '/days?date=2026-06-01');
    expect(oldest.status).toBe(200);
    expect(oldest.body).toMatchObject({ from: '2026-06-13', to: '2026-07-10' });
  });

  it('counts visits, stays and goals per day for 28 days and the 4 weeks before, with today typical up to now', async () => {
    const { setup, base } = await seed();
    const stranger = await bootstrap.utils.generalUtils.setupAnonymous();
    const appOnly = {
      ...event(base, 'm', '2026-10-02 11:00:00.000', { name: 'workspace_created' }),
      app: 'api',
      hostname: '',
      user_id: 'c'.repeat(64),
    };
    await insert([
      { ...base, cluster_id: stranger.cluster.id, visitor_id: 'e'.repeat(64) },
      appOnly,
      { ...appOnly, id: randomUUID(), created_at: '2026-10-02 11:05:00.000' },
      event(base, 'x', '2026-09-25 10:30:00.000', { referrer: 'news.ycombinator.com' }),
      event(base, 'y', '2026-09-25 13:00:00.000', { referrer: 'news.ycombinator.com' }),
      event(base, 'z', '2026-08-20 08:00:00.000'),
      event(base, 'o', '2026-10-02 11:58:00.000'),
    ]);

    const response = await get(setup.cluster.id, setup.token, `/days?${goals}`);

    expect(response.status).toBe(200);
    const data = response.body as WebAnalyticsDaysResponse;
    expect(data).toMatchObject({
      today: '2026-10-02',
      elapsed: 43_200,
      since: '2026-08-20',
      from: '2026-09-05',
      to: '2026-10-02',
      online: 1,
    });
    expect(data.days).toHaveLength(56);
    expect(data.days[0].date).toBe('2026-08-08');
    const day = (date: string): unknown => data.days.find((entry) => entry.date === date);
    expect(day('2026-10-02')).toEqual({
      date: '2026-10-02',
      visits: 5,
      stayed: 3,
      goals: [1, 2],
    });
    expect(day('2026-10-01')).toEqual({ date: '2026-10-01', visits: 1, stayed: 1, goals: [0, 0] });
    expect(day('2026-09-25')).toMatchObject({ visits: 2, stayed: 0 });
    expect(data.sources.find((series) => series.name === 'news.ycombinator.com')?.visits[20]).toBe(
      2,
    );
    expect(data.sources.find((series) => series.name === 'Direct')?.visits.at(-1)).toBe(3);
    expect(data.todayTypical).toEqual([
      { date: '2026-09-25', visits: 1, stayed: 0, goals: [0, 0] },
      { date: '2026-09-18', visits: 0, stayed: 0, goals: [0, 0] },
      { date: '2026-09-11', visits: 0, stayed: 0, goals: [0, 0] },
      { date: '2026-09-04', visits: 0, stayed: 0, goals: [0, 0] },
    ]);

    const earlier = (await get(setup.cluster.id, setup.token, '/days?date=2026-09-04'))
      .body as WebAnalyticsDaysResponse;
    expect(earlier).toMatchObject({ from: '2026-08-08', to: '2026-09-04', todayTypical: [] });
    expect(earlier.days.find((entry) => entry.date === '2026-08-20')?.visits).toBe(1);

    const tokyo = (await get(setup.cluster.id, setup.token, '/days?tz=Asia/Tokyo'))
      .body as WebAnalyticsDaysResponse;
    expect(tokyo.days.find((entry) => entry.date === '2026-10-02')?.visits).toBe(6);
  });

  it('keeps the anonymous landing and the identified events after signup in one visit, with the goals it sent on the website', async () => {
    const { setup } = await seed();

    const response = await get(setup.cluster.id, setup.token, `/days/2026-10-02/visits?${goals}`);

    expect(response.status).toBe(200);
    const data = response.body as WebAnalyticsDayVisitsResponse;
    expect(data.total).toBe(4);
    expect(data.visits.map((visit) => visit.startedAt)).toEqual([
      '2026-10-02T11:30:00.000Z',
      '2026-10-02T11:00:00.000Z',
      '2026-10-02T10:00:00.000Z',
      '2026-10-02T09:00:00.000Z',
    ]);
    expect(data.visits[2]).toEqual({
      id: user,
      identified: true,
      startedAt: '2026-10-02T10:00:00.000Z',
      lastSeenAt: '2026-10-02T10:01:00.000Z',
      source: 'www.google.com',
      entryPage: '/',
      exitPage: '/signup',
      pageviews: 2,
      sessions: 1,
      seconds: 60,
      stayed: true,
      goals: ['2026-10-02T10:00:50.000Z', null],
      country: 'PL',
      device: 'Desktop',
      browser: 'Chrome',
      os: 'Windows',
    });
    expect(data.visits[1]).toMatchObject({
      id: 'b0'.repeat(32),
      identified: false,
      source: 'Direct',
      pageviews: 1,
      seconds: 0,
      stayed: false,
      goals: [null, null],
    });
    expect(data.visits[3]).toMatchObject({
      source: 'newsletter',
      stayed: true,
      goals: [null, null],
    });

    const stayed = await get(
      setup.cluster.id,
      setup.token,
      `/days/2026-10-02/visits?${goals}&show=stayed`,
    );
    expect((stayed.body as WebAnalyticsDayVisitsResponse).total).toBe(3);
    const reached = await get(
      setup.cluster.id,
      setup.token,
      `/days/2026-10-02/visits?${goals}&show=goal`,
    );
    expect((reached.body as WebAnalyticsDayVisitsResponse).visits.map((visit) => visit.id)).toEqual(
      [user],
    );
    const next = await get(setup.cluster.id, setup.token, `/days/2026-10-02/visits?offset=3`);
    expect((next.body as WebAnalyticsDayVisitsResponse).visits).toHaveLength(1);
    const polish = await get(
      setup.cluster.id,
      setup.token,
      '/days/2026-10-02/visits?filter=country:PL',
    );
    expect((polish.body as WebAnalyticsDayVisitsResponse).visits).toMatchObject([
      { id: user, pageviews: 2 },
    ]);
  });

  it('reads a day by hour, source and landing page, next to the same weekday of the 4 weeks before up to the same time', async () => {
    const { setup, base } = await seed();
    await insert([
      {
        ...event(base, 'm', '2026-10-02 08:00:00.000', { name: 'workspace_created' }),
        app: 'api',
        hostname: '',
        user_id: 'c'.repeat(64),
      },
      event(base, 'x', '2026-09-25 10:30:00.000', { referrer: 'news.ycombinator.com' }),
      event(base, 'y', '2026-09-25 13:00:00.000', { referrer: 'news.ycombinator.com' }),
    ]);

    const response = await get(setup.cluster.id, setup.token, `/days/2026-10-02?${goals}`);

    expect(response.status).toBe(200);
    const data = response.body as WebAnalyticsDayResponse;
    expect(data).toMatchObject({
      date: '2026-10-02',
      dates: ['2026-10-02', '2026-09-25', '2026-09-18', '2026-09-11', '2026-09-04'],
      cutoff: 43_200,
    });
    expect(hoursWith(data.hours[0])).toEqual({ 9: 1, 10: 1, 11: 2 });
    expect(hoursWith(data.hours[1])).toEqual({ 10: 1, 13: 1 });
    expect(data.goalHours.map(hoursWith)).toEqual([{ 10: 1 }, { 8: 1, 10: 1 }]);
    expect(data.sourceHours.find((series) => series.name === 'Direct')?.visits[11]).toBe(2);
    const source = (name: string): unknown =>
      data.sources.find((group) => group.name === name)?.days.slice(0, 2);
    expect(source('www.google.com')).toEqual([
      { visits: 1, stayed: 1, medianSeconds: 60 },
      { visits: 0, stayed: 0, medianSeconds: 0 },
    ]);
    expect(source('news.ycombinator.com')).toEqual([
      { visits: 0, stayed: 0, medianSeconds: 0 },
      { visits: 1, stayed: 0, medianSeconds: 0 },
    ]);
    expect(data.pages.find((group) => group.name === '/')?.days[0]).toMatchObject({ visits: 4 });

    const past = (await get(setup.cluster.id, setup.token, `/days/2026-09-25?${goals}`))
      .body as WebAnalyticsDayResponse;
    expect(past.cutoff).toBeNull();
    expect(past.sources.find((group) => group.name === 'news.ycombinator.com')?.days[0]).toEqual({
      visits: 2,
      stayed: 0,
      medianSeconds: 0,
    });
  });

  it('picks the 2 most reached goals until the domain saves its own, and keeps saved goals listed', async () => {
    const { setup, base } = await seed();
    await insert([
      event(base, 'p', '2026-10-01 10:00:00.000', { name: 'download' }),
      event(base, 'q', '2026-10-01 11:00:00.000', { name: 'download' }),
    ]);

    const defaults = await get(setup.cluster.id, setup.token, '/goals');
    const body: UpdateWebAnalyticsGoalsBody = { goals: ['contact', 'signup', 'download'] };
    const saved = await request(bootstrap.app.getHttpServer())
      .put(`/clusters/${setup.cluster.id}/web_analytics/goals`)
      .set('Authorization', `Bearer ${setup.token}`)
      .send(body);
    const picked = await get(setup.cluster.id, setup.token, '/goals');

    expect(defaults.body as WebAnalyticsGoalsResponse).toEqual({
      goals: [
        { name: 'download', visits: 2 },
        { name: 'signup', visits: 1 },
        { name: 'workspace_created', visits: 1 },
      ],
      picked: ['download', 'signup'],
    });
    expect(saved.status).toBe(200);
    expect((saved.body as WebAnalyticsSiteSerialized).goals).toEqual([
      'contact',
      'signup',
      'download',
    ]);
    expect(
      await bootstrap.models.webAnalyticsSiteModel.findOne({ clusterId: setup.cluster.id }).lean(),
    ).toMatchObject({ goals: ['contact', 'signup', 'download'], origins: ['https://example.com'] });
    expect((picked.body as WebAnalyticsGoalsResponse).picked).toEqual([
      'contact',
      'signup',
      'download',
    ]);
    expect((picked.body as WebAnalyticsGoalsResponse).goals).toContainEqual({
      name: 'contact',
      visits: 0,
    });
    for (const goals of [[], eleven, ['signup', 'signup'], ['Signup']]) {
      const invalid = await request(bootstrap.app.getHttpServer())
        .put(`/clusters/${setup.cluster.id}/web_analytics/goals`)
        .set('Authorization', `Bearer ${setup.token}`)
        .send({ goals });
      expect(invalid.status).toBe(400);
    }
  });

  async function seed(): Promise<{
    setup: Awaited<ReturnType<typeof bootstrap.utils.generalUtils.setupAnonymous>>;
    base: WebEventClickhouseEntity;
  }> {
    const setup = await bootstrap.utils.generalUtils.setupAnonymous();
    const site = await configure(setup.cluster.id, setup.token);
    const base = row(setup.cluster.id, site.id);
    await insert([
      event(base, 'a', '2026-10-02 10:00:00.000', { referrer: 'www.google.com', country: 'PL' }),
      event(base, 'a', '2026-10-02 10:00:40.000', { path: '/signup', country: 'PL' }),
      event(base, 'a', '2026-10-02 10:00:50.000', { name: 'signup', user_id: user }),
      event(base, 'a', '2026-10-02 10:01:00.000', { name: 'pageleave', user_id: user }),
      {
        ...event(base, 'k', '2026-10-02 10:01:00.000', { name: 'workspace_created' }),
        app: 'api',
        hostname: '',
        user_id: user,
      },
      event(base, 'b0', '2026-10-02 11:00:00.000'),
      event(base, 'c', '2026-10-02 11:30:00.000'),
      event(base, 'c', '2026-10-02 11:30:30.000', { name: 'pageleave' }),
      event(base, 'd', '2026-10-02 09:00:00.000', { utm_source: 'newsletter' }),
      event(base, 'd', '2026-10-02 09:00:05.000', { path: '/pricing', utm_source: 'newsletter' }),
      event(base, 'f', '2026-10-01 20:00:00.000'),
      event(base, 'f', '2026-10-01 20:00:30.000', { name: 'pageleave' }),
    ]);
    return { setup, base };
  }

  function event(
    base: WebEventClickhouseEntity,
    visitor: string,
    at: string,
    overrides: Partial<WebEventClickhouseEntity> = {},
  ): WebEventClickhouseEntity {
    const id = visitor.repeat(64 / visitor.length);
    return {
      ...base,
      id: randomUUID(),
      visitor_id: id,
      session_id: `${id.slice(0, 63)}s`,
      created_at: at,
      ...overrides,
    };
  }

  function hoursWith(hours: number[]): Record<number, number> {
    return Object.fromEntries(hours.flatMap((visits, hour) => (visits ? [[hour, visits]] : [])));
  }

  async function configure(clusterId: string, token: string): Promise<WebAnalyticsSiteSerialized> {
    const response = await request(bootstrap.app.getHttpServer())
      .put(`/clusters/${clusterId}/web_analytics/site`)
      .set('Authorization', `Bearer ${token}`)
      .send({ origins: ['https://example.com'] });
    return response.body as WebAnalyticsSiteSerialized;
  }

  async function insert(values: WebEventClickhouseEntity[]): Promise<void> {
    await bootstrap.clickhouseClient.insert({ table: 'web_events', format: 'JSONEachRow', values });
  }

  function get(clusterId: string, token: string, suffix = ''): request.Test {
    return request(bootstrap.app.getHttpServer())
      .get(`/clusters/${clusterId}/web_analytics${suffix}`)
      .set('Authorization', `Bearer ${token}`);
  }

  function row(clusterId: string, siteId: string): WebEventClickhouseEntity {
    return {
      id: randomUUID(),
      cluster_id: clusterId,
      site_id: siteId,
      visitor_id: 'f'.repeat(64),
      session_id: '9'.repeat(64),
      user_id: '',
      created_at: '2026-10-02 10:00:00.000',
      received_at: '2026-10-02 11:00:00.000',
      expires_at: '2030-10-02 00:00:00',
      name: 'pageview',
      app: '',
      hostname: 'example.com',
      path: '/',
      referrer: '',
      utm_source: '',
      utm_medium: '',
      utm_campaign: '',
      utm_term: '',
      click_id: '',
      device: 'Desktop',
      browser: 'Chrome',
      os: 'Windows',
      country: '',
      props: {},
    };
  }
});
