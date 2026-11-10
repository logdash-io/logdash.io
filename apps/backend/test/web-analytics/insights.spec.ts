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
      ['post', `${base}/insights/reorder`, { placements: [{ id: insight.id, hidden: true }] }],
      ['put', `${base}/views`, { views: [{ name: 'Product' }] }],
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
      layout: 'rows',
      events: [{ name: 'malini_desktop_day', filters: [] }],
    });
    const third = await create(setup.cluster.id, setup.token, {
      type: 'distribution',
      title: 'L30',
      events: [{ name: 'malini_desktop_month' }],
      property: 'active_days',
    });

    // then
    expect(first).toEqual({
      id: expect.any(String) as string,
      layout: 'columns',
      ...withFilters(funnel),
    });
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
    const rows = await send(
      setup.token,
      'put',
      `${setup.cluster.id}/web_analytics/insights/${first.id}`,
      { ...funnel, layout: 'rows' },
    );
    expect(rows.body).toEqual({ id: first.id, layout: 'rows', ...withFilters(funnel) });
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
      { type: 'trend', title: 'Hours', events: [{ name: 'signup', bucket: 'hour' }] },
      { type: 'trend', title: 'Blank', events: [{ name: 'signup', label: '   ' }] },
      { type: 'trend', title: 'Long', events: [{ name: 'signup', label: 'x'.repeat(41) }] },
      { type: 'trend', title: 'Sessions', events: [{ name: 'signup' }], measure: 'sessions' },
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
      { name: 'malini_desktop_day', bucket: 'week', counts: [0, 1, 2], total: 3 },
      { name: 'malini_desktop_first_open', bucket: 'week', counts: [0, 2, 3], total: 5 },
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

  it('keeps the label and bucket of trend lines and drops them from other charts', async () => {
    // given
    const setup = await bootstrap.utils.generalUtils.setupAnonymous();
    const clusterId = setup.cluster.id;
    const weekly = {
      name: 'malini_desktop_day',
      filters: [{ key: 'week_first', op: 'eq', value: 'yes' }],
      bucket: 'week',
    };

    // when
    const trend = await create(clusterId, setup.token, {
      type: 'trend',
      title: 'Malini active',
      events: [{ name: 'malini_desktop_day' }, { ...weekly, label: '  Weekly  ' }],
    });
    const distribution = await create(clusterId, setup.token, {
      type: 'distribution',
      title: 'L30',
      events: [{ name: 'malini_desktop_month', label: 'L30', bucket: 'week' }],
      property: 'active_days',
    });
    const raw = await bootstrap.models.webAnalyticsSiteModel.findOne({ clusterId }).lean();

    // then
    expect(trend.events).toEqual([
      { name: 'malini_desktop_day', filters: [] },
      { ...weekly, label: 'Weekly' },
    ]);
    expect(distribution.events).toEqual([{ name: 'malini_desktop_month', filters: [] }]);
    expect((await list(clusterId, setup.token)).map((insight) => insight.events)).toEqual([
      trend.events,
      distribution.events,
    ]);
    expect(raw?.insights?.[0].events?.[0]).not.toHaveProperty('label');
    expect(raw?.insights?.[0].events?.[0]).not.toHaveProperty('bucket');
  });

  it('keeps the people measure of trends and drops it from other charts', async () => {
    // given
    const setup = await bootstrap.utils.generalUtils.setupAnonymous();
    const clusterId = setup.cluster.id;
    const trend = { type: 'trend', title: 'Active', events: [{ name: 'grip_open' }] };

    // when
    const people = await create(clusterId, setup.token, { ...trend, measure: 'people' });
    const events = await create(clusterId, setup.token, { ...trend, measure: 'events' });
    const plain = await create(clusterId, setup.token, trend);
    const asFunnel = await create(clusterId, setup.token, { ...funnel, measure: 'people' });
    const tabs = await create(clusterId, setup.token, {
      type: 'tabs',
      title: 'Active',
      tabs: [{ ...trend, measure: 'people' }, trend],
    });
    const raw = await bootstrap.models.webAnalyticsSiteModel.findOne({ clusterId }).lean();

    // then
    expect(people).toMatchObject({ measure: 'people' });
    for (const insight of [events, plain, asFunnel]) expect(insight).not.toHaveProperty('measure');
    expect(tabs.tabs).toMatchObject([{ measure: 'people' }, {}]);
    expect(tabs.tabs?.[1]).not.toHaveProperty('measure');
    expect((await list(clusterId, setup.token)).map((insight) => insight.measure)).toEqual([
      'people',
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
    expect(raw?.insights?.[1]).not.toHaveProperty('measure');

    // when the people trend is saved again without the measure, or as another chart
    const update = (id: string, body: object): request.Test =>
      send(setup.token, 'put', `${clusterId}/web_analytics/insights/${id}`, body);
    const kept = await update(plain.id, { ...trend, measure: 'people' });
    const back = await update(people.id, trend);
    const other = await update((kept.body as WebAnalyticsInsightSerialized).id, { ...funnel });

    // then
    expect(kept.body).toMatchObject({ measure: 'people' });
    expect(back.status).toBe(200);
    expect(back.body).not.toHaveProperty('measure');
    expect(other.body).not.toHaveProperty('measure');
    const after = await bootstrap.models.webAnalyticsSiteModel.findOne({ clusterId }).lean();
    expect(after?.insights?.map((insight) => insight.measure)).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
    expect(after?.insights?.[0]).not.toHaveProperty('measure');
  });

  it('counts each trend line per its own bucket on one day axis', async () => {
    // given
    const setup = await bootstrap.utils.generalUtils.setupAnonymous();
    const stranger = await bootstrap.utils.generalUtils.setupAnonymous();
    const site = await configure(setup.cluster.id, setup.token);
    const day = (at: string, props: Record<string, string>): WebEventClickhouseEntity => ({
      ...row(setup.cluster.id, site.id),
      name: 'malini_desktop_day',
      created_at: `${at} 10:00:00.000`,
      props,
    });
    const week = { week_first: 'yes', month_first: 'no' };
    const month = { week_first: 'no', month_first: 'yes' };
    await insert([
      day('2026-09-17', week),
      day('2026-09-19', { week_first: 'yes', month_first: 'yes' }),
      day('2026-09-22', week),
      day('2026-09-22', week),
      day('2026-09-23', { week_first: 'no', month_first: 'no' }),
      day('2026-09-29', week),
      day('2026-09-30', week),
      day('2026-09-30', week),
      day('2026-10-01', month),
      day('2026-10-02', month),
      { ...day('2026-09-22', week), cluster_id: stranger.cluster.id },
    ]);
    const line = (label: string, bucket: string, key?: string): object => ({
      name: 'malini_desktop_day',
      label,
      bucket,
      filters: key ? [{ key, op: 'eq', value: 'yes' }] : [],
    });
    const body = {
      type: 'trend',
      title: 'Malini active',
      days: 14,
      events: [
        line('Daily', 'day'),
        line('Weekly', 'week', 'week_first'),
        line('Monthly', 'month', 'month_first'),
      ],
    };

    // when
    const mixed = await run(setup.cluster.id, setup.token, body);
    const weeks = await run(setup.cluster.id, setup.token, {
      ...body,
      events: body.events.slice(1),
    });
    const inherited = await run(setup.cluster.id, setup.token, {
      ...body,
      bucket: 'week',
      events: [{ name: 'malini_desktop_day', label: 'Weekly' }],
    });

    // then
    const ticks = Array.from(
      { length: 15 },
      (_, index) => Date.parse('2026-09-18T00:00:00Z') + index * 86_400_000,
    );
    expect(mixed.times).toEqual(ticks);
    expect(mixed.series).toEqual([
      {
        name: 'malini_desktop_day',
        label: 'Daily',
        bucket: 'day',
        counts: [0, 1, 0, 0, 2, 1, 0, 0, 0, 0, 0, 1, 2, 1, 1],
        total: 9,
      },
      {
        name: 'malini_desktop_day',
        label: 'Weekly',
        bucket: 'week',
        counts: [1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3],
        total: 6,
      },
      {
        name: 'malini_desktop_day',
        label: 'Monthly',
        bucket: 'month',
        counts: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2],
        total: 3,
      },
    ]);
    expect(weeks.times).toEqual(ticks);
    expect(weeks.series?.map((series) => series.counts)).toEqual(
      mixed.series?.slice(1).map((series) => series.counts),
    );
    expect(inherited.times).toEqual(
      ['2026-09-14', '2026-09-21', '2026-09-28'].map((at) => Date.parse(`${at}T00:00:00Z`)),
    );
    expect(inherited.series).toEqual([
      {
        name: 'malini_desktop_day',
        label: 'Weekly',
        bucket: 'week',
        counts: [1, 3, 5],
        total: 9,
      },
    ]);
  });

  it('counts the distinct people of each trend line per its own bucket', async () => {
    // given
    const setup = await bootstrap.utils.generalUtils.setupAnonymous();
    const stranger = await bootstrap.utils.generalUtils.setupAnonymous();
    const site = await configure(setup.cluster.id, setup.token);
    const open = (
      at: string,
      user: string,
      props: Record<string, string> = {},
    ): WebEventClickhouseEntity => ({
      ...row(setup.cluster.id, site.id),
      name: 'grip_open',
      created_at: `${at} 10:00:00.000`,
      user_id: user,
      props,
    });
    await insert([
      open('2026-09-17', 'ana'),
      open('2026-09-19', 'ana'),
      open('2026-09-22', 'ana'),
      open('2026-09-22', 'ana'),
      open('2026-09-22', 'ben'),
      open('2026-09-23', 'ben'),
      open('2026-09-29', 'ana'),
      open('2026-09-30', 'cy'),
      open('2026-09-30', ''),
      open('2026-10-01', 'cy'),
      open('2026-10-02', 'ana', { plan: 'pro' }),
      { ...open('2026-09-22', 'zed'), cluster_id: stranger.cluster.id },
    ]);
    const line = (label: string, bucket: string, filters: object[] = []): object => ({
      name: 'grip_open',
      label,
      bucket,
      filters,
    });
    const body = {
      type: 'trend',
      title: 'Grip active',
      days: 14,
      measure: 'people',
      events: [
        line('Daily', 'day'),
        line('Weekly', 'week'),
        line('Monthly', 'month'),
        line('Pro', 'day', [{ key: 'plan', op: 'eq', value: 'pro' }]),
      ],
    };

    // when
    const people = await run(setup.cluster.id, setup.token, body);
    const weeks = await run(setup.cluster.id, setup.token, {
      ...body,
      bucket: 'week',
      events: [{ name: 'grip_open' }],
    });
    const events = await run(setup.cluster.id, setup.token, {
      ...body,
      measure: 'events',
      events: body.events.slice(0, 1),
    });

    // then
    const series = (label: string, bucket: string, counts: number[], total: number): object => ({
      name: 'grip_open',
      label,
      bucket,
      counts,
      total,
    });
    expect(people.measure).toBe('people');
    expect(people.series).toEqual([
      series('Daily', 'day', [0, 1, 0, 0, 2, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1], 3),
      series('Weekly', 'week', [1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2], 3),
      series('Monthly', 'month', [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2, 2], 3),
      series('Pro', 'day', [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], 1),
    ]);
    expect(weeks.measure).toBe('people');
    expect(weeks.series).toEqual([
      { name: 'grip_open', bucket: 'week', counts: [1, 2, 2], total: 3 },
    ]);
    expect(events.measure).toBe('events');
    expect(events.series).toEqual([
      series('Daily', 'day', [0, 1, 0, 0, 3, 1, 0, 0, 0, 0, 0, 1, 2, 1, 1], 10),
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

  it('lays out views and sections and keeps the placement of a card across edits', async () => {
    // given
    const setup = await bootstrap.utils.generalUtils.setupAnonymous();
    const clusterId = setup.cluster.id;
    const path = `${clusterId}/web_analytics`;
    const stored = await putViews(setup.token, clusterId, [
      {
        name: 'Product',
        sections: [{ title: 'Activation' }, { title: 'Retention', collapsed: true }],
      },
      { name: 'Traffic', traffic: true },
    ]);
    const [product, traffic] = stored.views;
    const [activation, retention] = product.sections;
    const unknown = new Types.ObjectId().toString();

    // when
    const plain = await create(clusterId, setup.token, funnel);
    const placed = await create(clusterId, setup.token, {
      ...funnel,
      view: product.id,
      section: activation.id,
      hidden: true,
      width: 'full',
    });
    const kept = await send(setup.token, 'put', `${path}/insights/${placed.id}`, {
      ...funnel,
      title: 'Renamed',
    });
    const moved = await send(setup.token, 'put', `${path}/insights/${placed.id}`, {
      ...funnel,
      view: traffic.id,
      section: null,
      hidden: false,
      width: 'half',
    });
    const sectioned = await send(setup.token, 'put', `${path}/insights/${plain.id}`, {
      ...funnel,
      section: retention.id,
    });
    const cleared = await send(setup.token, 'put', `${path}/insights/${placed.id}`, {
      ...funnel,
      view: null,
      hidden: null,
      width: null,
    });

    // then
    expect(stored).toEqual({
      views: [
        {
          id: expect.any(String) as string,
          name: 'Product',
          traffic: false,
          sections: [
            { id: expect.any(String) as string, title: 'Activation', collapsed: false },
            { id: expect.any(String) as string, title: 'Retention', collapsed: true },
          ],
        },
        { id: expect.any(String) as string, name: 'Traffic', traffic: true, sections: [] },
      ],
      insights: [],
    });
    expect(plain).toEqual({
      id: expect.any(String) as string,
      layout: 'columns',
      ...withFilters(funnel),
    });
    expect(placed).toMatchObject({
      view: product.id,
      section: activation.id,
      hidden: true,
      width: 'full',
    });
    expect(kept.body).toMatchObject({
      title: 'Renamed',
      view: product.id,
      section: activation.id,
      hidden: true,
      width: 'full',
    });
    expect(moved.body).toEqual({
      id: placed.id,
      layout: 'columns',
      ...withFilters(funnel),
      view: traffic.id,
      hidden: false,
      width: 'half',
    });
    expect(sectioned.body).toMatchObject({ id: plain.id, section: retention.id });
    expect(cleared.body).toEqual({ id: placed.id, layout: 'columns', ...withFilters(funnel) });
    const raw = await bootstrap.models.webAnalyticsSiteModel.findOne({ clusterId }).lean();
    for (const key of ['view', 'section', 'hidden', 'width'])
      expect(raw?.insights?.[1]).not.toHaveProperty(key);
    expect((await layout(clusterId, setup.token)).views).toEqual(stored.views);

    for (const [placement, message] of [
      [{ view: unknown }, 'Unknown view'],
      [{ section: unknown }, 'Unknown section'],
      [{ view: traffic.id, section: activation.id }, 'Unknown section'],
    ] as const)
      for (const response of [
        await send(setup.token, 'post', `${path}/insights`, { ...funnel, ...placement }),
        await send(setup.token, 'put', `${path}/insights/${plain.id}`, { ...funnel, ...placement }),
      ]) {
        expect(response.status).toBe(400);
        expect((response.body as { message: string }).message).toBe(message);
      }
    expect(
      (await send(setup.token, 'post', `${path}/insights`, { ...funnel, section: activation.id }))
        .status,
    ).toBe(201);
  });

  it('keeps cards of a removed view and lists views of a domain without any', async () => {
    // given
    const setup = await bootstrap.utils.generalUtils.setupAnonymous();
    const clusterId = setup.cluster.id;
    const legacy = await bootstrap.models.webAnalyticsSiteModel.collection.insertOne({
      clusterId,
      origins: [],
      goals: [],
      insights: [{ ...withFilters(funnel), _id: new Types.ObjectId() }],
    });

    // when
    const before = await layout(clusterId, setup.token);
    const { views } = await putViews(setup.token, clusterId, [{ name: 'Product' }]);
    const card = await create(clusterId, setup.token, { ...funnel, view: views[0].id });
    const emptied = await putViews(setup.token, clusterId, []);

    // then
    expect(before).toEqual({ views: [], insights: [expect.objectContaining({ type: 'funnel' })] });
    expect(emptied.views).toEqual([]);
    expect(emptied.insights.map((insight) => insight.id)).toEqual([before.insights[0].id, card.id]);
    expect(emptied.insights[1].view).toBe(views[0].id);
    await bootstrap.utils.auditLogUtils.assertAuditLog({
      userId: setup.user.id,
      action: AuditLogEntityAction.Update,
      relatedDomain: RelatedDomain.WebAnalytics,
      relatedEntityId: legacy.insertedId.toString(),
    });
  });

  it('keeps ids when views and sections are renamed, reordered and removed', async () => {
    // given
    const setup = await bootstrap.utils.generalUtils.setupAnonymous();
    const clusterId = setup.cluster.id;
    const { views } = await putViews(setup.token, clusterId, [
      { name: 'Product', sections: [{ title: 'Activation' }, { title: 'Retention' }] },
      { name: 'Growth' },
    ]);
    const [product, growth] = views;
    const [activation, retention] = product.sections;
    const unknown = new Types.ObjectId().toString();

    // when
    const edited = await putViews(setup.token, clusterId, [
      { id: growth.id, name: 'Acquisition', traffic: true },
      {
        id: product.id,
        name: 'Usage',
        sections: [{ title: 'New' }, { id: retention.id, title: 'Return', collapsed: true }],
      },
    ]);

    // then
    expect(edited.views).toEqual([
      { id: growth.id, name: 'Acquisition', traffic: true, sections: [] },
      {
        id: product.id,
        name: 'Usage',
        traffic: false,
        sections: [
          { id: expect.any(String) as string, title: 'New', collapsed: false },
          { id: retention.id, title: 'Return', collapsed: true },
        ],
      },
    ]);
    expect(edited.views[1].sections.map((section) => section.id)).not.toContain(activation.id);
    for (const rejected of [
      [{ id: unknown, name: 'Ghost' }],
      [{ name: 'Usage' }, { name: 'usage' }],
      [{ name: 'Usage', sections: [{ title: 'Same' }, { title: 'same' }] }],
      [
        { id: product.id, name: 'One' },
        { id: product.id, name: 'Two' },
      ],
      [{ id: product.id, name: 'One', sections: [{ id: unknown, title: 'Ghost' }] }],
      [{ id: growth.id, name: 'One', sections: [{ id: retention.id, title: 'Moved' }] }],
      [{ name: 'One', sections: [{ id: retention.id, title: 'Moved' }] }],
      [{ name: '   ' }],
    ])
      expect((await putViewsRaw(setup.token, clusterId, rejected)).status).toBe(400);
    expect((await layout(clusterId, setup.token)).views).toEqual(edited.views);
  });

  it('orders cards and places them in one call', async () => {
    // given
    const setup = await bootstrap.utils.generalUtils.setupAnonymous();
    const clusterId = setup.cluster.id;
    const path = `${clusterId}/web_analytics`;
    const { views } = await putViews(setup.token, clusterId, [
      { name: 'Product', sections: [{ title: 'Activation' }] },
      { name: 'Traffic' },
    ]);
    const [product, traffic] = views;
    const a = await create(clusterId, setup.token, { ...funnel, title: 'A' });
    const b = await create(clusterId, setup.token, { ...funnel, title: 'B' });
    const c = await create(clusterId, setup.token, { ...funnel, title: 'C' });
    const reorder = (body: object): request.Test =>
      send(setup.token, 'post', `${path}/insights/reorder`, body);
    const order = (response: request.Response): string[] =>
      (response.body as WebAnalyticsInsightsResponse).insights.map((insight) => insight.title);

    // when
    const placed = await reorder({
      placements: [
        { id: a.id, view: product.id, section: product.sections[0].id, width: 'half' },
        { id: b.id, hidden: true },
        { id: c.id },
      ],
    });
    const both = await reorder({
      ids: [c.id, b.id, a.id],
      placements: [
        { id: a.id, section: null, width: 'full' },
        { id: c.id, view: traffic.id },
      ],
    });
    const idsOnly = await reorder({ ids: [a.id, b.id, c.id] });

    // then
    expect(placed.status).toBe(200);
    expect(order(placed)).toEqual(['A', 'B', 'C']);
    expect((placed.body as WebAnalyticsInsightsResponse).views).toEqual(views);
    expect((placed.body as WebAnalyticsInsightsResponse).insights).toEqual([
      expect.objectContaining({
        id: a.id,
        view: product.id,
        section: product.sections[0].id,
        width: 'half',
      }),
      expect.objectContaining({ id: b.id, hidden: true }),
      { ...c },
    ]);
    expect(order(both)).toEqual(['C', 'B', 'A']);
    expect((both.body as WebAnalyticsInsightsResponse).insights).toEqual([
      { ...c, view: traffic.id },
      { ...b, hidden: true },
      { ...a, view: product.id, width: 'full' },
    ]);
    expect(order(idsOnly)).toEqual(['A', 'B', 'C']);
    expect((idsOnly.body as WebAnalyticsInsightsResponse).insights[0]).toMatchObject({
      view: product.id,
      width: 'full',
    });

    const before = await list(clusterId, setup.token);
    for (const body of [
      {},
      { placements: [{ id: new Types.ObjectId().toString(), hidden: true }] },
      { placements: [{ id: a.id, view: new Types.ObjectId().toString() }] },
      { placements: [{ id: a.id, view: traffic.id, section: product.sections[0].id }] },
      { ids: [b.id], placements: [{ id: a.id, hidden: true }] },
    ])
      expect((await reorder(body)).status).toBe(400);
    expect(await list(clusterId, setup.token)).toEqual(before);
    await bootstrap.utils.auditLogUtils.assertAuditLog({
      userId: setup.user.id,
      action: AuditLogEntityAction.Update,
      relatedDomain: RelatedDomain.WebAnalytics,
      relatedEntityId: b.id,
    });
  });

  it('saves tabbed cards with 2 to 6 charts and runs each tab on its own', async () => {
    // given
    const setup = await bootstrap.utils.generalUtils.setupAnonymous();
    const clusterId = setup.cluster.id;
    const path = `${clusterId}/web_analytics`;
    const { views } = await putViews(setup.token, clusterId, [{ name: 'Product' }]);
    const install = { type: 'funnel', title: 'Install', events: funnel.events };
    const daily = { type: 'trend', title: 'Daily', events: [{ name: 'malini_desktop_day' }] };
    const tabs = { type: 'tabs', title: 'Journeys', tabs: [install, daily] };

    // when
    const created = await create(clusterId, setup.token, {
      ...tabs,
      tabs: [{ ...install, view: views[0].id, hidden: true }, daily],
      steps: ['page:/'],
      view: views[0].id,
      width: 'full',
    });
    const renamed = await send(setup.token, 'put', `${path}/insights/${created.id}`, {
      ...tabs,
      title: '$total journeys',
      tabs: [{ ...install, title: '$100 installs' }, daily],
    });
    const asFunnel = await send(setup.token, 'put', `${path}/insights/${created.id}`, {
      ...funnel,
      tabs: [install, daily],
    });
    const raw = await bootstrap.models.webAnalyticsSiteModel.findOne({ clusterId }).lean();
    const again = await send(setup.token, 'put', `${path}/insights/${created.id}`, tabs);
    const ran = await send(setup.token, 'post', `${path}/insights/run`, tabs);

    // then
    expect(created).toEqual({
      id: expect.any(String) as string,
      type: 'tabs',
      title: 'Journeys',
      days: 30,
      view: views[0].id,
      width: 'full',
      tabs: [
        {
          type: 'funnel',
          title: 'Install',
          days: 30,
          mode: 'events',
          layout: 'columns',
          events: funnel.events.map((event) => ({ ...event, filters: [] })),
          filters: [],
        },
        {
          type: 'trend',
          title: 'Daily',
          days: 30,
          events: [{ name: 'malini_desktop_day', filters: [] }],
          filters: [],
          bucket: 'day',
        },
      ],
    });
    expect(await list(clusterId, setup.token)).toEqual([created]);
    expect(renamed.status).toBe(200);
    expect(renamed.body).toMatchObject({
      title: '$total journeys',
      view: views[0].id,
      width: 'full',
      tabs: [{ title: '$100 installs' }, { title: 'Daily' }],
    });
    expect(asFunnel.body).toMatchObject({ type: 'funnel', title: 'Install journey' });
    expect(asFunnel.body).not.toHaveProperty('tabs');
    expect(raw?.insights?.[0]).not.toHaveProperty('tabs');
    expect(again.body).toMatchObject({ type: 'tabs', tabs: [{ title: 'Install' }, {}] });
    expect(ran.status).toBe(400);
    expect((ran.body as { message: string }).message).toBe('Run each tab on its own');

    for (const [body, message] of [
      [{ ...tabs, tabs: [install] }, 'A tabs card takes 2 to 6 tabs'],
      [{ type: 'tabs', title: 'Empty' }, 'A tabs card takes 2 to 6 tabs'],
      [
        { ...tabs, tabs: [install, { type: 'tabs', title: 'Inner', tabs: [install, daily] }] },
        'Tabs cannot nest',
      ],
      [{ ...tabs, tabs: [install, { ...daily, tabs: [install, daily] }] }, 'Tabs cannot nest'],
      [{ ...tabs, tabs: [install, { ...daily, events: [] }] }, 'A trend takes 1 to 5 events'],
    ] as const) {
      const response = await send(setup.token, 'post', `${path}/insights`, body);
      expect(response.status).toBe(400);
      expect((response.body as { message: string }).message).toBe(message);
    }
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

  async function layout(clusterId: string, token: string): Promise<WebAnalyticsInsightsResponse> {
    const response = await send(token, 'get', `${clusterId}/web_analytics/insights`);
    expect(response.status).toBe(200);
    return response.body as WebAnalyticsInsightsResponse;
  }

  async function list(clusterId: string, token: string): Promise<WebAnalyticsInsightSerialized[]> {
    return (await layout(clusterId, token)).insights;
  }

  function putViewsRaw(token: string, clusterId: string, views: object[]): request.Test {
    return send(token, 'put', `${clusterId}/web_analytics/views`, { views });
  }

  async function putViews(
    token: string,
    clusterId: string,
    views: object[],
  ): Promise<WebAnalyticsInsightsResponse> {
    const response = await putViewsRaw(token, clusterId, views);
    expect(response.status).toBe(200);
    return response.body as WebAnalyticsInsightsResponse;
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
