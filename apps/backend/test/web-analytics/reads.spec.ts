import request from 'supertest';
import { randomBytes, randomUUID } from 'node:crypto';
import { advanceTo } from 'jest-date-mock';
import { createTestApp } from '../utils/bootstrap';
import {
  WebAnalyticsBreakdownResponse,
  WebAnalyticsEventResponse,
  WebAnalyticsFunnelResponse,
  WebAnalyticsJourneysResponse,
  WebAnalyticsOverviewResponse,
  WebAnalyticsResponse,
  WebAnalyticsRetentionResponse,
  WebAnalyticsStatusResponse,
  WebAnalyticsVisitorResponse,
  WebAnalyticsVisitorsResponse,
} from '../../src/web-analytics/core/dto/web-analytics.response';
import { WebEventClickhouseEntity } from '../../src/web-analytics/core/entities/web-event.clickhouse-entity';
import { WebAnalyticsSiteSerialized } from '../../src/web-analytics/core/entities/web-analytics-site.interface';
import { UserTier } from '../../src/user/core/enum/user-tier.enum';

describe('Web analytics (reads)', () => {
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;
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

  it('protects every report, configuration read and connection status by domain membership', async () => {
    const setup = await bootstrap.utils.generalUtils.setupAnonymous();
    const stranger = await bootstrap.utils.generalUtils.setupAnonymous();
    for (const suffix of [
      `?${week}`,
      `/overview?${week}`,
      `/breakdown?${week}&dimension=pages`,
      `/visitors?${week}`,
      `/visitors/${'a'.repeat(64)}`,
      `/journeys?${week}`,
      `/funnel?${week}&step=page:/&step=goal:signup`,
      `/retention?${week}`,
      `/events/start?${week}`,
      `/events/start/properties/mode?${week}`,
      '/site',
      '/status',
    ]) {
      const path = `/clusters/${setup.cluster.id}/web_analytics${suffix}`;
      expect((await request(bootstrap.app.getHttpServer()).get(path)).status).toBe(401);
      expect(
        (
          await request(bootstrap.app.getHttpServer())
            .get(path)
            .set('Authorization', `Bearer ${stranger.token}`)
        ).status,
      ).toBe(403);
    }
  });

  it('returns honest empty reports, filled buckets and unverified connection status', async () => {
    const setup = await bootstrap.utils.generalUtils.setupAnonymous();
    const response = await get(setup.cluster.id, setup.token, `?${week}`);
    expect(response.status).toBe(200);
    const data = response.body as WebAnalyticsResponse;
    expect(data.summary).toEqual({
      visitors: 0,
      pageviews: 0,
      sessions: 0,
      bounceRate: 0,
      sessionSeconds: 0,
      conversionRate: 0,
    });
    expect(data.series).toHaveLength(7);
    expect(data.series[0].time).toBe(Date.parse('2026-09-26T00:00:00Z'));
    expect(data.series.every((point) => point.visitors === 0)).toBe(true);
    expect(data.breakdowns.pages).toEqual([]);
    expect(data.to).toBe('2026-10-02T12:00:00.000Z');
    const status = await get(setup.cluster.id, setup.token, '/status');
    expect(status.body).toEqual({ lastWebEventAt: null, lastLogAt: null });
    const site = await get(setup.cluster.id, setup.token, '/site');
    expect(site.body).toEqual({ site: null });
  });

  it('keeps monthly buckets inside the range', async () => {
    const setup = await bootstrap.utils.generalUtils.setupClaimed({ userTier: UserTier.Pro });
    const response = await get(
      setup.cluster.id,
      setup.token,
      '?from=2025-10-02T12:00:00.000Z&to=2026-10-02T12:00:00.000Z&granularity=month',
    );
    expect(response.status).toBe(200);
    const data = response.body as WebAnalyticsResponse;
    expect(data.series[0].time).toBe(Date.parse('2025-10-01T00:00:00Z'));
    expect(data.series.at(-1)?.time).toBe(Date.parse('2026-10-01T00:00:00Z'));
    expect(data.series).toHaveLength(13);
  });

  it('rejects invalid time zones, filters and ranges too fine for the granularity', async () => {
    const setup = await bootstrap.utils.generalUtils.setupAnonymous();
    for (const query of [
      `?${week}&tz=Mars/Base`,
      `?${week}&filter=email:alice`,
      `?${week}&filter=prop.Mode:zen`,
      `?${week}&filter=prop.:zen`,
      `/events/Start?${week}`,
      `/events/start/properties/Mode?${week}`,
      `?from=2025-10-03T00:00:00.000Z&to=2026-10-03T00:00:00.000Z&granularity=hour`,
      `?from=2026-10-03T00:00:00.000Z&to=2026-10-02T00:00:00.000Z`,
    ]) {
      expect((await get(setup.cluster.id, setup.token, query)).status).toBe(400);
    }
    expect((await get(setup.cluster.id, setup.token, '/visitors/not-a-visitor')).status).toBe(400);
  });

  it('computes traffic, engagement, channels, pages, countries and goals without retry duplicates or foreign data', async () => {
    const setup = await bootstrap.utils.generalUtils.setupAnonymous();
    const stranger = await bootstrap.utils.generalUtils.setupAnonymous();
    const site = await configure(setup.cluster.id, setup.token);
    const base = row(setup.cluster.id, site.id);
    const alice = {
      ...base,
      visitor_id: 'a'.repeat(64),
      session_id: '1'.repeat(64),
      referrer: 'www.google.com',
      country: 'PL',
      os: 'macOS',
    };
    const landing = { ...alice, id: randomUUID(), created_at: '2026-10-01 10:00:00.000' };
    await insert([
      landing,
      landing,
      { ...alice, id: randomUUID(), created_at: '2026-10-01 10:02:00.000', path: '/pricing' },
      {
        ...alice,
        id: randomUUID(),
        created_at: '2026-10-01 10:03:00.000',
        path: '/pricing',
        name: 'signup_completed',
      },
      {
        ...base,
        id: randomUUID(),
        visitor_id: 'b'.repeat(64),
        session_id: '2'.repeat(64),
        created_at: '2026-10-02 09:00:00.000',
        utm_source: 'newsletter',
        utm_campaign: 'launch',
        utm_term: 'logs',
        device: 'Mobile',
        browser: 'Safari',
        os: 'iOS',
        country: 'DE',
      },
      {
        ...base,
        id: randomUUID(),
        visitor_id: 'c'.repeat(64),
        session_id: '3'.repeat(64),
        created_at: '2026-10-02 11:58:00.000',
        name: 'browser_error',
      },
      {
        ...base,
        id: randomUUID(),
        visitor_id: 'c'.repeat(64),
        session_id: '3'.repeat(64),
        created_at: '2026-10-02 11:57:00.000',
      },
      {
        ...base,
        id: randomUUID(),
        visitor_id: 'd'.repeat(64),
        created_at: '2026-09-22 10:00:00.000',
      },
      { ...base, id: randomUUID(), visitor_id: 'e'.repeat(64), expires_at: '2020-01-01 00:00:00' },
      { ...base, id: randomUUID(), cluster_id: stranger.cluster.id },
    ]);
    const response = await get(setup.cluster.id, setup.token, `?${week}&compare=true`);
    expect(response.status).toBe(200);
    const data = response.body as WebAnalyticsResponse;
    expect(data.summary).toEqual({
      visitors: 3,
      pageviews: 4,
      sessions: 3,
      bounceRate: (1 / 3) * 100,
      sessionSeconds: Math.round((180 + 0 + 60) / 3),
      conversionRate: (1 / 3) * 100,
    });
    expect(data.previous.visitors).toBe(1);
    expect(data.previous.sessions).toBe(1);
    expect(data.previousSeries).toHaveLength(7);
    expect(data.online).toBe(1);
    expect(data.series.at(-2)).toEqual({
      time: Date.parse('2026-10-01T00:00:00Z'),
      visitors: 1,
      pageviews: 2,
    });
    expect(data.breakdowns.channels).toEqual([
      { name: 'Organic search', visitors: 1, count: 2 },
      { name: 'Direct', visitors: 1, count: 1 },
      { name: 'Email', visitors: 1, count: 1 },
    ]);
    expect(data.breakdowns.pages).toEqual([
      { name: '/', visitors: 3, count: 3 },
      { name: '/pricing', visitors: 1, count: 1 },
    ]);
    expect(data.breakdowns.exitPages).toEqual([
      { name: '/', visitors: 2, count: 2 },
      { name: '/pricing', visitors: 1, count: 1 },
    ]);
    expect(data.breakdowns.countries).toEqual([
      { name: 'PL', visitors: 1, count: 2 },
      { name: 'DE', visitors: 1, count: 1 },
    ]);
    expect(data.breakdowns.keywords).toEqual([{ name: 'logs', visitors: 1, count: 1 }]);
    expect(data.breakdowns.goals).toEqual([{ name: 'signup_completed', visitors: 1, count: 1 }]);
    expect(data.goalSeries).toEqual([{ name: 'signup_completed', counts: [0, 0, 0, 0, 0, 1, 0] }]);

    const pricing = (await get(setup.cluster.id, setup.token, `?${week}&filter=page:/pricing`))
      .body as WebAnalyticsResponse;
    expect(pricing.summary.visitors).toBe(1);
    expect(pricing.summary.pageviews).toBe(2);
    const germany = (
      await get(setup.cluster.id, setup.token, `?${week}&filter=country:DE&filter=channel:Email`)
    ).body as WebAnalyticsResponse;
    expect(germany.summary.visitors).toBe(1);
    expect(germany.breakdowns.browsers).toEqual([{ name: 'Safari', visitors: 1, count: 1 }]);

    const warsaw = (
      await get(
        setup.cluster.id,
        setup.token,
        '/overview?from=2026-10-01T22:00:00.000Z&to=2026-10-02T22:00:00.000Z&granularity=hour&tz=Europe/Warsaw',
      )
    ).body as WebAnalyticsOverviewResponse;
    expect(warsaw.visitors).toBe(2);
    expect(warsaw.online).toBe(1);
    expect(warsaw.series).toHaveLength(14);
    expect(warsaw.series[0].time).toBe(Date.parse('2026-10-01T22:00:00Z'));

    const status = (await get(setup.cluster.id, setup.token, '/status'))
      .body as WebAnalyticsStatusResponse;
    expect(status.lastWebEventAt).toBe('2026-10-02T11:00:00.000Z');
  });

  it('lists visitors with their journeys, common paths, funnels and retention', async () => {
    const setup = await bootstrap.utils.generalUtils.setupAnonymous();
    const site = await configure(setup.cluster.id, setup.token);
    const base = row(setup.cluster.id, site.id);
    const visitor = (id: string, session: string, at: string, path: string, name = 'pageview') => ({
      ...base,
      id: randomUUID(),
      visitor_id: id.repeat(64),
      session_id: session.repeat(64),
      created_at: at,
      path,
      name,
    });
    await insert([
      visitor('a', '1', '2026-09-27 10:00:00.000', '/'),
      visitor('a', '1', '2026-09-27 10:01:00.000', '/pricing'),
      { ...visitor('a', '2', '2026-09-28 10:00:00.000', '/'), utm_source: 'newsletter' },
      {
        ...visitor('a', '2', '2026-09-28 10:01:00.000', '/', 'signup_completed'),
        utm_source: 'newsletter',
      },
      visitor('b', '3', '2026-09-27 12:00:00.000', '/'),
      visitor('b', '3', '2026-09-27 12:01:00.000', '/pricing'),
      visitor('c', '4', '2026-09-27 13:00:00.000', '/docs'),
    ]);
    const list = (await get(setup.cluster.id, setup.token, `/visitors?${week}`))
      .body as WebAnalyticsVisitorsResponse;
    expect(list.total).toBe(3);
    expect(list.visitors[0]).toMatchObject({
      id: 'a'.repeat(64),
      identified: false,
      firstSeen: '2026-09-27T10:00:00.000Z',
      sessions: 2,
      pageviews: 3,
      activeDays: ['2026-09-27', '2026-09-28'],
      lastSeen: '2026-09-28T10:01:00.000Z',
      source: 'Direct',
    });
    const detail = (await get(setup.cluster.id, setup.token, `/visitors/${'a'.repeat(64)}`))
      .body as WebAnalyticsVisitorResponse;
    expect(detail.visitor?.pageviews).toBe(3);
    expect(detail.events.map((event) => event.name)).toEqual([
      'signup_completed',
      'pageview',
      'pageview',
      'pageview',
    ]);
    expect(detail.events.map((event) => event.source)).toEqual([
      'newsletter',
      'newsletter',
      'Direct',
      'Direct',
    ]);
    const journeys = (await get(setup.cluster.id, setup.token, `/journeys?${week}`))
      .body as WebAnalyticsJourneysResponse;
    expect(journeys.journeys).toEqual([{ steps: ['/', '/pricing'], sessions: 2 }]);
    const funnel = (
      await get(
        setup.cluster.id,
        setup.token,
        `/funnel?${week}&step=page:/&step=page:/pricing&step=goal:signup_completed`,
      )
    ).body as WebAnalyticsFunnelResponse;
    expect(funnel.steps.map((step) => step.visitors)).toEqual([2, 2, 1]);
    const retention = (await get(setup.cluster.id, setup.token, `/retention?${week}`))
      .body as WebAnalyticsRetentionResponse;
    expect(retention).toEqual({
      cohorts: [],
      stickiness: { dailyActive: 0, monthlyActive: 0, ratio: null },
      comebacks: [
        { minDays: 30, users: 0 },
        { minDays: 60, users: 0 },
        { minDays: 90, users: 0 },
      ],
    });
  });

  it('attributes sessions to their start, counts engaged sessions as non-bounces and ignores page leaves', async () => {
    const setup = await bootstrap.utils.generalUtils.setupAnonymous();
    const site = await configure(setup.cluster.id, setup.token);
    const base = row(setup.cluster.id, site.id);
    const range = 'from=2026-09-28T00:00:00.000Z&to=2026-09-29T00:00:00.000Z';
    const event = (id: string, at: string, name = 'pageview', path = '/') => ({
      ...base,
      id: randomUUID(),
      visitor_id: id.repeat(64),
      session_id: id.repeat(64),
      created_at: at,
      name,
      path,
    });
    await insert([
      event('1', '2026-09-28 10:00:00.000', 'browser_error'),
      event('2', '2026-09-28 10:00:00.000'),
      event('2', '2026-09-28 10:00:02.000', 'signup_completed'),
      event('3', '2026-09-28 11:00:00.000'),
      event('3', '2026-09-28 11:00:15.000', 'pageleave'),
      event('4', '2026-09-28 12:00:00.000'),
      event('4', '2026-09-28 12:00:05.000', 'pageleave'),
      event('5', '2026-09-27 23:30:00.000', 'pageview', '/early'),
      event('5', '2026-09-28 00:10:00.000', 'pageview', '/late'),
      event('6', '2026-09-28 23:50:00.000', 'pageview', '/start'),
      event('6', '2026-09-29 00:20:00.000', 'pageview', '/end'),
      event('6', '2026-09-29 00:20:30.000', 'pageleave', '/end'),
      event('7', '2026-10-02 11:50:00.000'),
      event('7', '2026-10-02 11:59:00.000', 'pageleave'),
      event('8', '2026-10-02 11:58:00.000'),
    ]);

    const data = (await get(setup.cluster.id, setup.token, `?${range}`))
      .body as WebAnalyticsResponse;
    expect(data.summary).toEqual({
      visitors: 6,
      pageviews: 5,
      sessions: 4,
      bounceRate: 25,
      sessionSeconds: Math.round((2 + 15 + 5 + 1830) / 4),
      conversionRate: (1 / 6) * 100,
    });
    expect(data.previous).toEqual({
      visitors: 1,
      pageviews: 1,
      sessions: 1,
      bounceRate: 0,
      sessionSeconds: 2400,
      conversionRate: 0,
    });
    expect(data.online).toBe(1);
    expect(data.breakdowns.goals).toEqual([{ name: 'signup_completed', visitors: 1, count: 1 }]);
    expect(data.goalSeries.map((goal) => goal.name)).toEqual(['signup_completed']);
    expect(data.breakdowns.entryPages).toEqual([
      { name: '/', visitors: 3, count: 3 },
      { name: '/start', visitors: 1, count: 1 },
    ]);
    expect(data.breakdowns.exitPages).toEqual([
      { name: '/', visitors: 3, count: 3 },
      { name: '/end', visitors: 1, count: 1 },
    ]);

    const start = (await get(setup.cluster.id, setup.token, `?${range}&filter=page:/start`))
      .body as WebAnalyticsResponse;
    expect(start.summary).toMatchObject({ sessions: 1, bounceRate: 0, sessionSeconds: 1830 });
    const journeys = (await get(setup.cluster.id, setup.token, `/journeys?${range}`))
      .body as WebAnalyticsJourneysResponse;
    expect(journeys.journeys).toEqual([{ steps: ['/start', '/end'], sessions: 1 }]);
    const funnel = (
      await get(setup.cluster.id, setup.token, `/funnel?${range}&step=page:/&step=goal:pageleave`)
    ).body as WebAnalyticsFunnelResponse;
    expect(funnel.steps.map((step) => step.visitors)).toEqual([3, 0]);
    const timeline = (await get(setup.cluster.id, setup.token, `/visitors/${'3'.repeat(64)}`))
      .body as WebAnalyticsVisitorResponse;
    expect(timeline.events.map((item) => item.name)).toEqual(['pageview']);
  });

  it('counts an identified user once across daily visitor ids in visitors, profiles, funnels and goal filters', async () => {
    // given
    const setup = await bootstrap.utils.generalUtils.setupAnonymous();
    const site = await configure(setup.cluster.id, setup.token);
    const base = row(setup.cluster.id, site.id);
    const user = 'd'.repeat(64);
    const event = (visitor: string, userId: string, at: string, name = 'pageview') => ({
      ...base,
      id: randomUUID(),
      visitor_id: visitor.repeat(64),
      session_id: visitor.repeat(64),
      user_id: userId,
      created_at: at,
      name,
    });
    await insert([
      event('a', user, '2026-09-27 10:00:00.000'),
      event('b', user, '2026-09-28 10:00:00.000'),
      event('b', user, '2026-09-28 10:01:00.000', 'signup_completed'),
      event('c', '', '2026-09-28 11:00:00.000'),
    ]);

    // when
    const report = (await get(setup.cluster.id, setup.token, `?${week}`))
      .body as WebAnalyticsResponse;
    const list = (await get(setup.cluster.id, setup.token, `/visitors?${week}`))
      .body as WebAnalyticsVisitorsResponse;
    const profile = (await get(setup.cluster.id, setup.token, `/visitors/${user}`))
      .body as WebAnalyticsVisitorResponse;
    const funnel = (
      await get(
        setup.cluster.id,
        setup.token,
        `/funnel?${week}&step=page:/&step=goal:signup_completed`,
      )
    ).body as WebAnalyticsFunnelResponse;
    const converted = (
      await get(setup.cluster.id, setup.token, `?${week}&filter=goal:signup_completed`)
    ).body as WebAnalyticsResponse;

    // then
    expect(report.summary).toMatchObject({ visitors: 2, sessions: 3 });
    expect(list.total).toBe(2);
    expect(list.visitors).toMatchObject([
      { id: 'c'.repeat(64), identified: false, sessions: 1 },
      {
        id: user,
        identified: true,
        sessions: 2,
        pageviews: 2,
        firstSeen: '2026-09-27T10:00:00.000Z',
        activeDays: ['2026-09-27', '2026-09-28'],
      },
    ]);
    expect(profile.visitor).toMatchObject({ id: user, identified: true, sessions: 2 });
    expect(profile.events).toHaveLength(3);
    expect(funnel.steps.map((step) => step.visitors)).toEqual([2, 1]);
    expect(converted.summary).toMatchObject({ visitors: 1, pageviews: 2 });
  });

  it('reports identified-user cohorts, stickiness and comebacks within the plan retention', async () => {
    // given
    const setup = await bootstrap.utils.generalUtils.setupClaimed({ userTier: UserTier.Pro });
    const site = await configure(setup.cluster.id, setup.token);
    const base = row(setup.cluster.id, site.id);
    const active = (user: string, ...days: string[]) =>
      days.map((day) => ({
        ...base,
        id: randomUUID(),
        visitor_id: randomBytes(32).toString('hex'),
        user_id: user.repeat(64),
        created_at: `${day} 10:00:00.000`,
      }));
    await insert([
      ...active('1', '2026-09-01', '2026-09-02', '2026-09-08', '2026-10-01'),
      ...active('2', '2026-09-01'),
      ...active('3', '2026-09-30', '2026-10-01'),
      ...active('4', '2026-07-01', '2026-09-05'),
      ...active('5', '2026-05-01', '2026-09-10'),
      ...active('6', '2026-08-25', '2026-09-02'),
      {
        ...base,
        id: randomUUID(),
        visitor_id: 'e'.repeat(64),
        created_at: '2026-09-15 10:00:00.000',
      },
    ]);

    // when
    const response = await get(
      setup.cluster.id,
      setup.token,
      '/retention?from=2026-09-01T00:00:00.000Z&to=2026-10-03T00:00:00.000Z',
    );

    // then
    expect(response.status).toBe(200);
    expect(response.body as WebAnalyticsRetentionResponse).toEqual({
      cohorts: [
        { date: '2026-09-30', users: 1, day1: 100, day7: null, day30: null, day90: null },
        { date: '2026-09-01', users: 2, day1: 50, day7: 50, day30: 50, day90: null },
      ],
      stickiness: { dailyActive: 10 / 32, monthlyActive: 4, ratio: (10 / 32 / 4) * 100 },
      comebacks: [
        { minDays: 30, users: 2 },
        { minDays: 60, users: 2 },
        { minDays: 90, users: 1 },
      ],
    });
  });

  it('breaks a custom event down by property values and filters every report by a property value', async () => {
    // given
    const setup = await bootstrap.utils.generalUtils.setupAnonymous();
    const stranger = await bootstrap.utils.generalUtils.setupAnonymous();
    const site = await configure(setup.cluster.id, setup.token);
    const base = row(setup.cluster.id, site.id);
    const visitor = (id: string): WebEventClickhouseEntity => ({
      ...base,
      visitor_id: id.repeat(64),
      session_id: id.repeat(64),
    });
    const at = (
      who: WebEventClickhouseEntity,
      name: string,
      props: Record<string, string> = {},
    ): WebEventClickhouseEntity => ({ ...who, id: randomUUID(), name, props });
    const [alice, bob, carol] = [visitor('a'), visitor('b'), visitor('c')];
    await insert([
      at(alice, 'pageview'),
      at(alice, 'start', { mode: 'zen', theme: 'dark' }),
      at(alice, 'start', { mode: 'classic', theme: 'dark' }),
      at(bob, 'pageview'),
      at(bob, 'start', { mode: 'zen', theme: 'light' }),
      at(bob, 'listen', { remote: 'yes' }),
      at(carol, 'pageview'),
      at({ ...row(stranger.cluster.id, site.id), visitor_id: 'd'.repeat(64) }, 'start', {
        mode: 'zen',
      }),
    ]);

    // when
    const event = await get(setup.cluster.id, setup.token, `/events/start?${week}&compare=true`);
    const modes = await get(setup.cluster.id, setup.token, `/events/start/properties/mode?${week}`);
    const classicThemes = await get(
      setup.cluster.id,
      setup.token,
      `/events/start/properties/theme?${week}&filter=prop.mode:classic`,
    );
    const remote = await get(setup.cluster.id, setup.token, `?${week}&filter=prop.remote:yes`);
    const remoteStarts = await get(
      setup.cluster.id,
      setup.token,
      `/events/start?${week}&filter=prop.remote:yes`,
    );

    // then
    const data = event.body as WebAnalyticsEventResponse;
    expect(data.summary).toEqual({ count: 3, visitors: 2, conversionRate: (2 / 3) * 100 });
    expect(data.previous).toEqual({ count: 0, visitors: 0, conversionRate: 0 });
    expect(data.series).toHaveLength(7);
    expect(data.series.reduce((sum, point) => sum + point.count, 0)).toBe(3);
    expect(data.previousSeries).toHaveLength(7);
    expect(data.properties).toEqual([
      { name: 'mode', visitors: 2, count: 3 },
      { name: 'theme', visitors: 2, count: 3 },
    ]);
    expect((modes.body as WebAnalyticsBreakdownResponse).rows).toEqual([
      { name: 'zen', visitors: 2, count: 2 },
      { name: 'classic', visitors: 1, count: 1 },
    ]);
    expect((classicThemes.body as WebAnalyticsBreakdownResponse).rows).toEqual([
      { name: 'dark', visitors: 1, count: 2 },
    ]);
    expect((remote.body as WebAnalyticsResponse).summary.visitors).toBe(1);
    expect((remoteStarts.body as WebAnalyticsEventResponse).summary).toEqual({
      count: 1,
      visitors: 1,
      conversionRate: 100,
    });
  });

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
      expires_at: '2027-10-02 00:00:00',
      name: 'pageview',
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
