import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { advanceTo } from 'jest-date-mock';
import { createTestApp } from '../utils/bootstrap';
import { Action } from '../../src/personal-api-key/core/enums/action.enum';
import { Resource } from '../../src/personal-api-key/core/enums/resource.enum';
import { AccessRestriction } from '../../src/personal-api-key/core/types/access-restriction.type';
import { ScopeEntry } from '../../src/personal-api-key/core/types/scope-entry.type';
import { CreatePersonalApiKeyResponse } from '../../src/personal-api-key/core/dto/create-personal-api-key.response';
import { WebEventClickhouseEntity } from '../../src/web-analytics/core/entities/web-event.clickhouse-entity';
import { WebAnalyticsSiteSerialized } from '../../src/web-analytics/core/entities/web-analytics-site.interface';

type Rpc = { id?: unknown; result?: Record<string, unknown>; error?: { code: number } };

type ToolResult = { isError: boolean; text: string; json: Record<string, unknown> };

describe('MCP server', () => {
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;

  const READ = [{ resource: Resource.WebAnalytics, action: Action.Read }];
  const WRITE = [{ resource: Resource.WebAnalytics, action: Action.Write }];
  const ALL: AccessRestriction = { kind: 'all' };
  const READ_TOOLS = [
    'describe',
    'overview',
    'breakdown',
    'person_funnel',
    'events_funnel',
    'trend',
    'distribution',
    'cohort_table',
    'retention',
    'list_insights',
    'run_insight',
  ];
  const WRITE_TOOLS = ['create_insight', 'update_insight', 'reorder_insights', 'delete_insight'];

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

  it('speaks JSON-RPC over Streamable HTTP', async () => {
    // given
    const setup = await bootstrap.utils.generalUtils.setupAnonymous();
    const key = await createKey(setup.token, READ, ALL);

    // then
    expect((await request(bootstrap.app.getHttpServer()).post('/mcp').send({})).status).toBe(401);
    const stream = await request(bootstrap.app.getHttpServer()).get('/mcp');
    expect(stream.status).toBe(405);
    expect(stream.headers.allow).toBe('POST');

    const initialized = await post(key, {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test' } },
    });
    expect(initialized.status).toBe(200);
    expect(initialized.body).toEqual({
      jsonrpc: '2.0',
      id: 1,
      result: {
        protocolVersion: '2025-06-18',
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'logdash', title: 'Logdash', version: '1.0.0' },
        instructions: expect.stringContaining('describe') as string,
      },
    });
    expect(
      ((await rpc(key, 'initialize', { protocolVersion: '1999-01-01' })).result ?? {})
        .protocolVersion,
    ).toBe('2025-06-18');

    const notification = await post(key, { jsonrpc: '2.0', method: 'notifications/initialized' });
    expect(notification.status).toBe(202);
    expect(notification.text).toBe('');
    expect((await post(key, { jsonrpc: '2.0', id: 9, result: {} })).status).toBe(202);

    expect(await rpc(key, 'ping')).toEqual({ jsonrpc: '2.0', id: 1, result: {} });
    expect((await rpc(key, 'resources/list')).error).toEqual({
      code: -32601,
      message: 'Method resources/list not found',
    });
    expect((await rpc(key, 'tools/call', { name: 'drop_tables' })).error?.code).toBe(-32602);
    expect(
      ((await post(key, [{ jsonrpc: '2.0', id: 1, method: 'ping' }])).body as Rpc).error?.code,
    ).toBe(-32600);
    expect(((await post(key, { id: 1, method: 'ping' })).body as Rpc).error?.code).toBe(-32600);
  });

  it('lists and runs only the tools the key scopes allow', async () => {
    // given
    const setup = await bootstrap.utils.generalUtils.setupAnonymous();
    await configure(setup.cluster.id, setup.token);
    const none = await createKey(
      setup.token,
      [{ resource: Resource.Logs, action: Action.Read }],
      ALL,
    );
    const read = await createKey(setup.token, READ, ALL);
    const write = await createKey(setup.token, WRITE, ALL);
    const insight = {
      clusterId: setup.cluster.id,
      type: 'trend',
      title: 'Days',
      events: [{ name: 'malini_desktop_day' }],
    };

    // then
    expect(await toolNames(none)).toEqual([]);
    expect(await toolNames(read)).toEqual(READ_TOOLS);
    expect(await toolNames(write)).toEqual([...READ_TOOLS, ...WRITE_TOOLS]);
    expect(await toolNames(setup.token)).toEqual([...READ_TOOLS, ...WRITE_TOOLS]);

    expect(await call(none, 'describe', {})).toMatchObject({
      isError: true,
      text: 'This key lacks the webAnalytics:read scope',
    });
    expect(await call(read, 'create_insight', insight)).toMatchObject({
      isError: true,
      text: 'This key lacks the webAnalytics:write scope',
    });
    expect((await call(write, 'create_insight', insight)).isError).toBe(false);

    const base = `/clusters/${setup.cluster.id}/web_analytics/insights`;
    const server = (): ReturnType<typeof request> => request(bootstrap.app.getHttpServer());
    expect((await server().get(base).set('Authorization', `Bearer ${read}`)).status).toBe(200);
    expect(
      (await server().post(base).set('Authorization', `Bearer ${read}`).send(insight)).status,
    ).toBe(403);
    expect((await server().get(base).set('Authorization', `Bearer ${none}`)).status).toBe(403);
    expect(
      (
        await server()
          .get(`/clusters/${setup.cluster.id}/web_analytics/schema`)
          .set('Authorization', `Bearer ${read}`)
      ).status,
    ).toBe(200);
  });

  it('reaches only the domains of the key', async () => {
    // given
    const setup = await bootstrap.utils.generalUtils.setupAnonymous();
    const stranger = await bootstrap.utils.generalUtils.setupAnonymous();
    const second = await bootstrap.utils.projectGroupUtils.storeCluster({
      creatorId: setup.user.id,
      name: 'Second domain',
    });
    const all = await createKey(setup.token, READ, ALL);
    const first = await createKey(setup.token, READ, { kind: 'clusters', ids: [setup.cluster.id] });
    const projects = await createKey(setup.token, READ, {
      kind: 'projects',
      ids: [setup.project.id],
    });

    // then
    expect(domains(await call(all, 'describe', {}))).toEqual(
      expect.arrayContaining([setup.cluster.id, second.id]),
    );
    expect(domains(await call(all, 'describe', {}))).toHaveLength(2);
    expect(domains(await call(first, 'describe', {}))).toEqual([setup.cluster.id]);
    expect(domains(await call(projects, 'describe', {}))).toEqual([]);
    for (const [key, clusterId] of [
      [first, second.id],
      [all, stranger.cluster.id],
      [projects, setup.cluster.id],
    ]) {
      for (const [name, args] of [
        ['describe', { clusterId }],
        ['overview', { clusterId }],
        ['list_insights', { clusterId }],
      ] as const)
        expect(await call(key, name, args)).toMatchObject({
          isError: true,
          text: 'This key does not reach that domain',
        });
    }
  });

  it('validates tool arguments', async () => {
    // given
    const setup = await bootstrap.utils.generalUtils.setupAnonymous();
    const key = await createKey(setup.token, WRITE, ALL);
    const clusterId = setup.cluster.id;

    // then
    for (const [name, args, message] of [
      ['overview', { clusterId: 'nope' }, 'clusterId must be a mongodb id'],
      ['overview', { clusterId, days: 400 }, 'days must not be greater than 365'],
      ['overview', { clusterId, tz: 'Mars/Base' }, 'tz must be an IANA time zone'],
      ['overview', { clusterId, filter: ['planet:mars'] }, 'filter must match'],
      ['overview', { clusterId, drop: true }, 'property drop should not exist'],
      ['breakdown', { clusterId, dimension: 'secrets' }, 'dimension must be one of'],
      [
        'events_funnel',
        { clusterId, events: [{ name: 'Bad Name' }, { name: 'ok' }] },
        'events.0.name must match',
      ],
      [
        'events_funnel',
        { clusterId, events: [{ name: 'a', filters: [{ key: 'k', op: 'like', value: 'x' }] }] },
        'events.0.filters.0.op must be one of',
      ],
      ['events_funnel', { clusterId, events: [{ name: 'a' }] }, 'takes 2 to 8 events'],
      ['distribution', { clusterId, events: [{ name: 'a' }] }, 'takes a numeric property'],
      ['person_funnel', { clusterId, steps: ['page:/', 'click:x'] }, 'steps must match'],
      ['create_insight', { clusterId, type: 'trend', title: ' ' }, 'title must not be blank'],
      ['delete_insight', { clusterId, insightId: 'x' }, 'insightId must be a mongodb id'],
    ] as const) {
      const result = await call(key, name, args);
      expect(result.isError).toBe(true);
      expect(result.text).toContain(message);
    }
    expect(
      (
        await rpc(key, 'tools/call', {
          name: 'describe',
          arguments: ['not', 'an', 'object'],
        })
      ).result,
    ).toMatchObject({ isError: true });
  });

  it('reads Malini-shaped events in compact summaries', async () => {
    // given
    const setup = await bootstrap.utils.generalUtils.setupAnonymous();
    const site = await configure(setup.cluster.id, setup.token);
    const key = await createKey(setup.token, READ, ALL);
    const clusterId = setup.cluster.id;
    const marker = (
      name: string,
      props: Record<string, string>,
      at = '2026-09-30 10:00:00.000',
    ) => ({
      ...row(clusterId, site.id),
      name: `malini_desktop_${name}`,
      hostname: 'app.malini',
      created_at: at,
      props,
    });
    await insert([
      ...['a', 'b', 'c'].map((id) => ({
        ...row(clusterId, site.id),
        visitor_id: id.repeat(64),
        session_id: id.repeat(64),
        utm_source: 'reddit',
        utm_campaign: id === 'c' ? 'r_macapps' : 'r_sveltejs',
        utm_content: id === 'a' ? 'post_1' : 'post_2',
      })),
      ...[0, 1, 2].map(() => marker('first_open', { cohort: '2026-09-29', days: '0' })),
      ...[0, 1].map(() => marker('setup_finished', { cohort: '2026-09-29', days: '0' })),
      marker('first_prompt', { cohort: '2026-09-29', days: '1' }),
      marker(
        'day',
        { week_first: 'yes', month_first: 'yes', age: 'day_1' },
        '2026-09-29 10:00:00.000',
      ),
      marker('day', { week_first: 'no', month_first: 'no', age: 'day_1' }),
      ...['1', '3', '3', '30'].map((days) =>
        marker('month', { month: '2026-09', active_days: days }, '2026-10-01 10:00:00.000'),
      ),
    ]);

    // when
    const described = (await call(key, 'describe', { days: 7 })).json;
    const overview = (await call(key, 'overview', { clusterId, days: 7 })).json;
    const campaigns = (
      await call(key, 'breakdown', {
        clusterId,
        dimension: 'campaigns',
        filter: ['source:reddit'],
        limit: 1,
      })
    ).json;
    const contents = (
      await call(key, 'breakdown', {
        clusterId,
        dimension: 'contents',
        filter: ['campaign:r_sveltejs'],
      })
    ).json;
    const funnel = (
      await call(key, 'events_funnel', {
        clusterId,
        events: [
          { name: 'malini_desktop_first_open' },
          { name: 'malini_desktop_setup_finished' },
          { name: 'malini_desktop_first_prompt' },
        ],
        filters: [{ key: 'cohort', op: 'gte', value: '2026-09-28' }],
      })
    ).json;
    const trend = (
      await call(key, 'trend', {
        clusterId,
        days: 4,
        tz: 'Europe/Warsaw',
        events: [
          { name: 'malini_desktop_day' },
          {
            name: 'malini_desktop_day',
            filters: [{ key: 'week_first', op: 'eq', value: 'yes' }],
          },
        ],
      })
    ).json;
    const distribution = (
      await call(key, 'distribution', {
        clusterId,
        events: [{ name: 'malini_desktop_month' }],
        property: 'active_days',
        binSize: 10,
      })
    ).json;
    const cohorts = (
      await call(key, 'cohort_table', {
        clusterId,
        events: [{ name: 'malini_desktop_first_open' }, { name: 'malini_desktop_setup_finished' }],
      })
    ).json;
    const people = (
      await call(key, 'person_funnel', { clusterId, steps: ['page:/', 'goal:malini_desktop_day'] })
    ).json;
    const retention = await call(key, 'retention', { clusterId });

    // then
    expect(described).toEqual({
      days: 7,
      domains: [
        {
          clusterId,
          name: setup.cluster.name,
          retentionDays: 90,
          site: {
            origins: ['https://example.com', 'https://app.malini'],
            goals: [],
            insights: 0,
          },
          events: expect.arrayContaining([
            { name: 'malini_desktop_month', count: 4, properties: ['active_days', 'month'] },
            { name: 'malini_desktop_first_open', count: 3, properties: ['cohort', 'days'] },
          ]) as unknown[],
        },
      ],
    });
    expect(overview).toMatchObject({
      from: '2026-09-25',
      to: '2026-10-02',
      summary: { pageviews: 3 },
      top: { sources: [{ name: 'reddit', visitors: 3 }] },
    });
    expect((overview.series as unknown[]).length).toBe(8);
    expect(campaigns).toEqual({
      dimension: 'campaigns',
      rows: [{ name: 'r_sveltejs', visitors: 2, count: 2 }],
      total: 2,
    });
    expect(contents).toMatchObject({
      rows: [
        { name: 'post_1', visitors: 1 },
        { name: 'post_2', visitors: 1 },
      ],
    });
    expect(funnel).toMatchObject({
      type: 'funnel',
      to: '2026-10-02',
      steps: [
        { name: 'malini_desktop_first_open', count: 3, conversion: 100, dropOff: null },
        { name: 'malini_desktop_setup_finished', count: 2, conversion: 66.7, dropOff: 33.3 },
        { name: 'malini_desktop_first_prompt', count: 1, conversion: 33.3, dropOff: 50 },
      ],
    });
    expect(trend).toMatchObject({
      type: 'trend',
      times: ['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02'],
      series: [
        { name: 'malini_desktop_day', counts: [0, 1, 1, 0, 0], total: 2 },
        { name: 'malini_desktop_day', counts: [0, 1, 0, 0, 0], total: 1 },
      ],
    });
    expect(distribution).toMatchObject({
      bins: [
        { value: 0, count: 3, share: 75 },
        { value: 10, count: 0, share: 0 },
        { value: 20, count: 0, share: 0 },
        { value: 30, count: 1, share: 25 },
      ],
      summary: { count: 4, mean: 9.3, median: 3 },
    });
    expect(cohorts).toMatchObject({
      cohorts: [
        { cohort: '2026-09-28', counts: [3, 2], shares: [100, 66.7], filling: [true, true] },
      ],
      lagDays: [1, 1],
    });
    expect(people).toEqual({
      steps: [
        { name: 'page:/', count: 3, conversion: 100, dropOff: null },
        { name: 'goal:malini_desktop_day', count: 0, conversion: 0, dropOff: 100 },
      ],
    });
    expect(retention.isError).toBe(false);
    expect(retention.json).toMatchObject({ stickiness: { monthlyActive: 0 } });
    expect(retention.text.length).toBeLessThan(2000);
  });

  it('builds a dashboard of saved insights', async () => {
    // given
    const setup = await bootstrap.utils.generalUtils.setupAnonymous();
    await configure(setup.cluster.id, setup.token);
    const key = await createKey(setup.token, WRITE, ALL);
    const clusterId = setup.cluster.id;

    // when
    const journey = (
      await call(key, 'create_insight', {
        clusterId,
        type: 'funnel',
        title: 'Install journey',
        layout: 'rows',
        events: [{ name: 'malini_desktop_first_open' }, { name: 'malini_desktop_first_merge' }],
      })
    ).json;
    const l30 = (
      await call(key, 'create_insight', {
        clusterId,
        type: 'distribution',
        title: 'L30',
        events: [{ name: 'malini_desktop_month' }],
        property: 'active_days',
      })
    ).json;
    const updated = await call(key, 'update_insight', {
      clusterId,
      insightId: l30.id,
      type: 'distribution',
      title: 'L30 of September',
      events: [
        { name: 'malini_desktop_month', filters: [{ key: 'month', op: 'eq', value: '2026-09' }] },
      ],
      property: 'active_days',
    });
    const reordered = await call(key, 'reorder_insights', { clusterId, ids: [l30.id, journey.id] });
    const ran = (await call(key, 'run_insight', { clusterId, insightId: journey.id })).json;
    const deleted = await call(key, 'delete_insight', { clusterId, insightId: journey.id });

    // then
    expect(journey).toMatchObject({
      id: expect.any(String) as string,
      mode: 'events',
      layout: 'rows',
      days: 30,
    });
    expect(updated.json).toMatchObject({ id: l30.id, title: 'L30 of September' });
    expect((reordered.json.insights as { id: string }[]).map((insight) => insight.id)).toEqual([
      l30.id,
      journey.id,
    ]);
    expect(ran).toMatchObject({
      id: journey.id,
      title: 'Install journey',
      type: 'funnel',
      steps: [
        { name: 'malini_desktop_first_open', count: 0, conversion: null },
        { name: 'malini_desktop_first_merge', count: 0, conversion: null, dropOff: null },
      ],
    });
    expect(deleted.json).toEqual({ deleted: journey.id });
    expect((await call(key, 'list_insights', { clusterId })).json).toEqual({
      insights: [expect.objectContaining({ id: l30.id, title: 'L30 of September' })],
    });
    expect(await call(key, 'delete_insight', { clusterId, insightId: journey.id })).toMatchObject({
      isError: true,
      text: 'Insight not found',
    });
    await bootstrap.utils.auditLogUtils.assertAuditLog({ relatedEntityId: l30.id as string });
  });

  async function createKey(
    token: string,
    scopes: ScopeEntry[],
    access: AccessRestriction,
  ): Promise<string> {
    const response = await request(bootstrap.app.getHttpServer())
      .post('/personal-api-keys')
      .set('Authorization', `Bearer ${token}`)
      .send({ label: 'mcp', scopes, access });
    expect(response.status).toBe(201);
    return (response.body as CreatePersonalApiKeyResponse).value;
  }

  function post(key: string, body: object): request.Test {
    return request(bootstrap.app.getHttpServer())
      .post('/mcp')
      .set('Authorization', `Bearer ${key}`)
      .set('Accept', 'application/json, text/event-stream')
      .send(body);
  }

  async function rpc(key: string, method: string, params?: object): Promise<Rpc> {
    const response = await post(key, { jsonrpc: '2.0', id: 1, method, params });
    expect(response.status).toBe(200);
    return response.body as Rpc;
  }

  async function toolNames(key: string): Promise<string[]> {
    const { result } = await rpc(key, 'tools/list');
    return ((result?.tools ?? []) as { name: string }[]).map((tool) => tool.name);
  }

  async function call(key: string, name: string, args: object): Promise<ToolResult> {
    const { result } = await rpc(key, 'tools/call', { name, arguments: args });
    const { content, isError } = result as { content: { text: string }[]; isError?: boolean };
    const text = content[0].text;
    return {
      isError: isError ?? false,
      text,
      json: isError ? {} : (JSON.parse(text) as Record<string, unknown>),
    };
  }

  function domains(result: ToolResult): string[] {
    return (result.json.domains as { clusterId: string }[]).map((domain) => domain.clusterId);
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
      created_at: '2026-10-01 10:00:00.000',
      received_at: '2026-10-01 11:00:00.000',
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
