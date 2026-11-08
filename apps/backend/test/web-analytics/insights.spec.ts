import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import { advanceTo } from 'jest-date-mock';
import { createTestApp } from '../utils/bootstrap';
import { AuditLogEntityAction } from '../../src/audit-log/core/enums/audit-log-actions.enum';
import { RelatedDomain } from '../../src/audit-log/core/enums/related-domain.enum';
import { WebEventClickhouseEntity } from '../../src/web-analytics/core/entities/web-event.clickhouse-entity';
import { WebAnalyticsSiteSerialized } from '../../src/web-analytics/core/entities/web-analytics-site.interface';
import {
  WebAnalyticsInsightResult,
  WebAnalyticsInsightSerialized,
  WebAnalyticsInsightsResponse,
  WebAnalyticsSchemaResponse,
} from '../../src/web-analytics/core/dto/web-analytics-insight.response';

describe('Web analytics insights', () => {
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;

  const funnel = {
    type: 'funnel',
    title: 'Install journey',
    days: 30,
    mode: 'events',
    events: [
      { name: 'malini_desktop_first_open' },
      { name: 'malini_desktop_setup_finished' },
      { name: 'malini_desktop_first_prompt' },
    ],
    filters: [{ key: 'cohort', op: 'gte', value: '2026-09-28' }],
  };

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

  it('protects every insight route by domain membership', async () => {
    const setup = await bootstrap.utils.generalUtils.setupAnonymous();
    const stranger = await bootstrap.utils.generalUtils.setupAnonymous();
    const insight = await create(setup.cluster.id, setup.token, funnel);
    const base = `/clusters/${setup.cluster.id}/web_analytics`;
    for (const [method, path, body] of [
      ['get', `${base}/schema`, undefined],
      ['get', `${base}/insights`, undefined],
      ['post', `${base}/insights`, funnel],
      ['post', `${base}/insights/run`, funnel],
      ['post', `${base}/insights/reorder`, { ids: [insight.id] }],
      ['put', `${base}/insights/${insight.id}`, funnel],
      ['delete', `${base}/insights/${insight.id}`, undefined],
    ] as const) {
      const server = request(bootstrap.app.getHttpServer());
      expect((await server[method](path).send(body)).status).toBe(401);
      expect(
        (await server[method](path).set('Authorization', `Bearer ${stranger.token}`).send(body))
          .status,
      ).toBe(403);
    }
  });

  it('saves, lists, edits, reorders and removes insights of a domain', async () => {
    // given
    const setup = await bootstrap.utils.generalUtils.setupAnonymous();
    const other = await bootstrap.utils.generalUtils.setupAnonymous();
    const foreign = await create(other.cluster.id, other.token, funnel);

    // when
    const first = await create(setup.cluster.id, setup.token, funnel);
    const second = await create(setup.cluster.id, setup.token, {
      type: 'trend',
      title: '  Daily users  ',
      steps: ['page:/'],
      events: [{ name: 'malini_desktop_day', filters: [] }],
    });
    const third = await create(setup.cluster.id, setup.token, {
      type: 'distribution',
      title: 'L30',
      events: [{ name: 'malini_desktop_month' }],
      property: 'active_days',
    });

    // then
    expect(first).toEqual({ id: expect.any(String) as string, ...withFilters(funnel) });
    expect(second).toEqual({
      id: expect.any(String) as string,
      type: 'trend',
      title: 'Daily users',
      days: 30,
      events: [{ name: 'malini_desktop_day', filters: [] }],
      filters: [],
      bucket: 'day',
    });
    expect(third).toMatchObject({ property: 'active_days', binSize: 1 });
    expect((await list(setup.cluster.id, setup.token)).map((insight) => insight.id)).toEqual([
      first.id,
      second.id,
      third.id,
    ]);

    const edited = await send(
      setup.token,
      'put',
      `${setup.cluster.id}/web_analytics/insights/${second.id}`,
      {
        type: 'trend',
        title: 'Weekly users',
        days: 90,
        bucket: 'week',
        events: [
          { name: 'malini_desktop_day', filters: [{ key: 'week_first', op: 'eq', value: 'yes' }] },
        ],
      },
    );
    expect(edited.status).toBe(200);
    expect(edited.body).toMatchObject({ id: second.id, title: 'Weekly users', bucket: 'week' });
    expect(
      (
        await send(
          setup.token,
          'put',
          `${setup.cluster.id}/web_analytics/insights/${foreign.id}`,
          funnel,
        )
      ).status,
    ).toBe(404);

    const reordered = await send(
      setup.token,
      'post',
      `${setup.cluster.id}/web_analytics/insights/reorder`,
      {
        ids: [third.id, first.id, second.id],
      },
    );
    expect(reordered.status).toBe(200);
    expect(
      (reordered.body as WebAnalyticsInsightsResponse).insights.map((insight) => [
        insight.id,
        insight.title,
      ]),
    ).toEqual([
      [third.id, 'L30'],
      [first.id, 'Install journey'],
      [second.id, 'Weekly users'],
    ]);
    for (const ids of [
      [third.id, first.id],
      [third.id, first.id, foreign.id],
    ])
      expect(
        (
          await send(setup.token, 'post', `${setup.cluster.id}/web_analytics/insights/reorder`, {
            ids,
          })
        ).status,
      ).toBe(400);

    expect(
      (await send(setup.token, 'delete', `${setup.cluster.id}/web_analytics/insights/${first.id}`))
        .status,
    ).toBe(200);
    expect(
      (await send(setup.token, 'delete', `${setup.cluster.id}/web_analytics/insights/${first.id}`))
        .status,
    ).toBe(404);
    expect(
      (await send(setup.token, 'delete', `${setup.cluster.id}/web_analytics/insights/not-an-id`))
        .status,
    ).toBe(404);
    expect((await list(setup.cluster.id, setup.token)).map((insight) => insight.id)).toEqual([
      third.id,
      second.id,
    ]);
    expect((await list(other.cluster.id, other.token)).map((insight) => insight.id)).toEqual([
      foreign.id,
    ]);
    for (const action of [
      AuditLogEntityAction.Create,
      AuditLogEntityAction.Update,
      AuditLogEntityAction.Delete,
    ])
      await bootstrap.utils.auditLogUtils.assertAuditLog({
        userId: setup.user.id,
        action,
        relatedDomain: RelatedDomain.WebAnalytics,
        relatedEntityId: action === AuditLogEntityAction.Update ? second.id : first.id,
      });
  });

  it('rejects insights that do not fit their type and keeps at most 50 per domain', async () => {
    const setup = await bootstrap.utils.generalUtils.setupAnonymous();
    const path = `${setup.cluster.id}/web_analytics/insights`;
    for (const body of [
      { ...funnel, events: funnel.events.slice(0, 1) },
      { ...funnel, mode: 'people', steps: ['page:/'] },
      { type: 'distribution', title: 'L30', events: [{ name: 'malini_desktop_month' }] },
      { type: 'trend', title: 'Too many', events: Array(6).fill({ name: 'signup' }) },
      { type: 'cohorts', title: ' ', events: funnel.events },
    ])
      expect((await send(setup.token, 'post', path, body)).status).toBe(400);

    await create(setup.cluster.id, setup.token, funnel);
    await bootstrap.models.webAnalyticsSiteModel.updateOne(
      { clusterId: setup.cluster.id },
      {
        $push: {
          insights: Array.from({ length: 49 }, () => ({
            ...withFilters(funnel),
            _id: new Types.ObjectId(),
          })),
        },
      },
    );
    expect((await send(setup.token, 'post', path, funnel)).status).toBe(400);
    expect(await list(setup.cluster.id, setup.token)).toHaveLength(50);
  });

  it('counts events of each funnel step, per bucket, by numeric value and by cohort', async () => {
    // given
    const setup = await bootstrap.utils.generalUtils.setupAnonymous();
    const stranger = await bootstrap.utils.generalUtils.setupAnonymous();
    const site = await configure(setup.cluster.id, setup.token);
    const marker = (
      name: string,
      at: string,
      props: Record<string, string>,
    ): WebEventClickhouseEntity => ({
      ...row(setup.cluster.id, site.id),
      name: `malini_desktop_${name}`,
      path: '/',
      hostname: 'app.malini',
      created_at: `${at} 10:00:00.000`,
      props,
    });
    const late = { cohort: '2026-09-28', days: '0' };
    const early = { cohort: '2026-09-21', days: '0' };
    await insert([
      marker('first_open', '2026-09-28', late),
      marker('first_open', '2026-09-28', late),
      marker('first_open', '2026-09-29', { cohort: '2026-09-29', days: '0' }),
      marker('first_open', '2026-09-21', early),
      marker('first_open', '2026-09-22', { cohort: '2026-09-22', days: '0' }),
      marker('first_open', '2026-08-01', { cohort: '2026-08-01', days: '0' }),
      marker('setup_finished', '2026-09-28', late),
      marker('setup_finished', '2026-09-29', { cohort: '2026-09-29', days: '0' }),
      marker('setup_finished', '2026-09-21', early),
      marker('first_prompt', '2026-09-30', { cohort: '2026-09-28', days: '2' }),
      marker('returned_week_1', '2026-09-25', { cohort: '2026-09-21', days: '4' }),
      marker('returned_week_1', '2026-09-28', { cohort: '2026-09-22', days: '6' }),
      marker('day', '2026-09-22', { week_first: 'yes', month_first: 'no', age: 'day_1' }),
      marker('day', '2026-09-23', { week_first: 'no', month_first: 'no', age: 'week_1' }),
      marker('day', '2026-09-29', { week_first: 'yes', month_first: 'no', age: 'later' }),
      marker('day', '2026-09-30', { week_first: 'yes', month_first: 'no', age: 'later' }),
      ...['1', '3', '3', '30', 'many'].map((activeDays) =>
        marker('month', '2026-10-01', { month: '2026-09', active_days: activeDays }),
      ),
      { ...marker('first_open', '2026-09-28', late), cluster_id: stranger.cluster.id },
      { ...marker('first_open', '2026-09-28', late), expires_at: '2020-01-01 00:00:00' },
    ]);

    // when
    const events = await run(setup.cluster.id, setup.token, funnel);
    const stepFilter = await run(setup.cluster.id, setup.token, {
      ...funnel,
      filters: [],
      events: [
        {
          name: 'malini_desktop_first_open',
          filters: [{ key: 'cohort', op: 'lt', value: '2026-09-28' }],
        },
        {
          name: 'malini_desktop_setup_finished',
          filters: [{ key: 'days', op: 'lte', value: '0' }],
        },
      ],
    });
    const trend = await run(setup.cluster.id, setup.token, {
      type: 'trend',
      title: 'Weekly users and installs',
      days: 14,
      bucket: 'week',
      events: [
        { name: 'malini_desktop_day', filters: [{ key: 'week_first', op: 'eq', value: 'yes' }] },
        { name: 'malini_desktop_first_open' },
      ],
    });
    const distribution = await run(setup.cluster.id, setup.token, {
      type: 'distribution',
      title: 'L30',
      events: [
        { name: 'malini_desktop_month', filters: [{ key: 'month', op: 'eq', value: '2026-09' }] },
      ],
      property: 'active_days',
    });
    const wide = await run(setup.cluster.id, setup.token, {
      type: 'distribution',
      title: 'L30 by tens',
      events: [{ name: 'malini_desktop_month' }],
      property: 'active_days',
      binSize: 10,
    });
    const cohorts = await run(setup.cluster.id, setup.token, {
      type: 'cohorts',
      title: 'Activation by week',
      events: [
        { name: 'malini_desktop_first_open' },
        { name: 'malini_desktop_setup_finished' },
        { name: 'malini_desktop_returned_week_1' },
      ],
    });

    // then
    expect(events.steps).toEqual([
      { name: 'malini_desktop_first_open', count: 3 },
      { name: 'malini_desktop_setup_finished', count: 2 },
      { name: 'malini_desktop_first_prompt', count: 1 },
    ]);
    expect(stepFilter.steps?.map((step) => step.count)).toEqual([2, 3]);
    expect(trend.times).toEqual(
      ['2026-09-14', '2026-09-21', '2026-09-28'].map((day) => Date.parse(`${day}T00:00:00Z`)),
    );
    expect(trend.series).toEqual([
      { name: 'malini_desktop_day', counts: [0, 1, 2] },
      { name: 'malini_desktop_first_open', counts: [0, 2, 3] },
    ]);
    expect(distribution.bins).toHaveLength(30);
    expect(distribution.bins?.filter((bin) => bin.count)).toEqual([
      { value: 1, count: 1, share: 25 },
      { value: 3, count: 2, share: 50 },
      { value: 30, count: 1, share: 25 },
    ]);
    expect(distribution.summary).toEqual({ count: 4, mean: 9.25, median: 3 });
    expect(wide.bins?.map((bin) => [bin.value, bin.count])).toEqual([
      [0, 3],
      [10, 0],
      [20, 0],
      [30, 1],
    ]);
    expect(cohorts.lagDays).toEqual([0, 0, 6]);
    expect(cohorts.cohorts).toEqual([
      {
        cohort: '2026-09-28',
        counts: [3, 2, 0],
        shares: [100, (2 / 3) * 100, 0],
        filling: [true, true, true],
      },
      {
        cohort: '2026-09-21',
        counts: [2, 1, 2],
        shares: [100, 50, 100],
        filling: [false, false, true],
      },
    ]);
  });

  it('runs people funnels and lists event names with their property keys', async () => {
    // given
    const setup = await bootstrap.utils.generalUtils.setupAnonymous();
    const site = await configure(setup.cluster.id, setup.token);
    await insert([
      { ...row(setup.cluster.id, site.id), path: '/' },
      {
        ...row(setup.cluster.id, site.id),
        path: '/pricing',
        created_at: '2026-10-02 10:01:00.000',
      },
      {
        ...row(setup.cluster.id, site.id),
        name: 'signup',
        created_at: '2026-10-02 10:02:00.000',
        props: { plan: 'pro' },
      },
      {
        ...row(setup.cluster.id, site.id),
        visitor_id: 'e'.repeat(64),
        name: 'signup',
        props: { plan: 'free', source: 'docs' },
      },
    ]);

    // when
    const people = await run(setup.cluster.id, setup.token, {
      type: 'funnel',
      title: 'Signups',
      mode: 'people',
      steps: ['page:/', 'page:/pricing', 'goal:signup'],
    });
    const schema = await send(
      setup.token,
      'get',
      `${setup.cluster.id}/web_analytics/schema?days=7`,
    );

    // then
    expect(people.steps).toEqual([
      { name: 'page:/', count: 1 },
      { name: 'page:/pricing', count: 1 },
      { name: 'goal:signup', count: 1 },
    ]);
    expect((schema.body as WebAnalyticsSchemaResponse).events).toEqual([
      { name: 'pageview', count: 2, properties: [] },
      { name: 'signup', count: 2, properties: ['plan', 'source'] },
    ]);
  });

  function withFilters(body: typeof funnel): Record<string, unknown> {
    return { ...body, events: body.events.map((event) => ({ ...event, filters: [] })) };
  }

  async function create(
    clusterId: string,
    token: string,
    body: object,
  ): Promise<WebAnalyticsInsightSerialized> {
    const response = await send(token, 'post', `${clusterId}/web_analytics/insights`, body);
    expect(response.status).toBe(201);
    return response.body as WebAnalyticsInsightSerialized;
  }

  async function list(clusterId: string, token: string): Promise<WebAnalyticsInsightSerialized[]> {
    const response = await send(token, 'get', `${clusterId}/web_analytics/insights`);
    expect(response.status).toBe(200);
    return (response.body as WebAnalyticsInsightsResponse).insights;
  }

  async function run(
    clusterId: string,
    token: string,
    body: object,
  ): Promise<WebAnalyticsInsightResult> {
    const response = await send(token, 'post', `${clusterId}/web_analytics/insights/run`, body);
    expect(response.status).toBe(200);
    return response.body as WebAnalyticsInsightResult;
  }

  function send(
    token: string,
    method: 'get' | 'post' | 'put' | 'delete',
    path: string,
    body?: object,
  ): request.Test {
    return request(bootstrap.app.getHttpServer())
      [method](`/clusters/${path}`)
      .set('Authorization', `Bearer ${token}`)
      .send(body);
  }

  async function configure(clusterId: string, token: string): Promise<WebAnalyticsSiteSerialized> {
    const response = await request(bootstrap.app.getHttpServer())
      .put(`/clusters/${clusterId}/web_analytics/site`)
      .set('Authorization', `Bearer ${token}`)
      .send({ origins: ['https://example.com', 'https://app.malini'] });
    return response.body as WebAnalyticsSiteSerialized;
  }

  async function insert(values: WebEventClickhouseEntity[]): Promise<void> {
    await bootstrap.clickhouseClient.insert({ table: 'web_events', format: 'JSONEachRow', values });
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
      app: '',
      hostname: 'example.com',
      path: '/',
      referrer: '',
      utm_source: '',
      utm_medium: '',
      utm_campaign: '',
      utm_term: '',
      utm_content: '',
      click_id: '',
      device: 'Desktop',
      browser: 'Chrome',
      os: 'Windows',
      country: '',
      props: {},
    };
  }
});
