---
name: backend-e2e-tests
description: Write and run tests for the NestJS backend (apps/backend) - e2e specs against the real app with in-memory Mongo and Redis/ClickHouse containers, setup helpers, test utils, mocking outbound HTTP, time and async work, plus colocated unit specs for pure logic. Use when adding or fixing backend tests, reproducing a backend bug, or registering a new module or model in the test app.
---

# Backend tests

Read the testing rules in `.agents/backend.md` first.

## Where tests go

- Behavior through HTTP: `apps/backend/test/<domain>/reads.spec.ts` and `writes.spec.ts`. Topic specs sit next to them (`ttl.spec.ts`, `full-process.spec.ts`).
- Pure logic with branches (date math, parsing, aggregation): a unit spec next to the file in `src/`, e.g. `src/log/analytics/log-analytics-date-alignment.service.spec.ts`. Fake collaborators with `Test.createTestingModule` providers, like `src/project/read/project-read-cached.service.spec.ts`.
- Reproduce bugs with an e2e spec first. It is the closest thing to what a user hits.

## Run

Docker must be running. Global setup starts (and reuses) Redis and ClickHouse containers. Mongo is in-memory.
No `.env` is needed; `test/utils/setup-env.ts` fills in test values.

```bash
pnpm --filter backend test test/http-monitors/writes.spec.ts
pnpm --filter backend test test/http-monitors -t 'creates new monitor'
pnpm --filter backend test
```

Pass arguments without `--`. After `--`, jest reads `-t` and its value as path patterns, so the name filter is silently ignored.
Specs run one file at a time in a single worker that Jest restarts once it holds more than 1 GB, so the whole suite runs locally in a few minutes.
The test scripts start Jest with `node --no-sparkplug`, and the workers inherit the flag.
Node 24 has a V8 garbage collector bug (nodejs/node#62393) that kills a worker with SIGSEGV about once in ten full runs. Jest then reports whichever suite was running as failed, so it looks like a flaky test.
The flag turns off the compiler tier where the bug lives. Node 22, which CI and production use, is not affected. Drop the flag once a Node 24 release ships the fix (backport nodejs/node#65753).
Two test runs at the same time share the Redis and ClickHouse containers and wipe each other's data, so run one at a time.
CI runs `check`, `lint`, then every spec in batches of three (`.github/workflows/backend-test-on-pr.yml`).

Anything built on `new Date()` must not depend on where "now" falls inside a minute, hour or day. Align it (`startOfMinute`) or pin it (`advanceTo`), or the spec fails a few runs in a hundred.

## Spec skeleton

```ts
describe('IncidentCoreController (writes)', () => {
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    bootstrap = await createTestApp();
  });

  beforeEach(async () => {
    await bootstrap.methods.beforeEach();
  });

  afterAll(async () => {
    await bootstrap.methods.afterAll();
  });

  describe('POST /projects/:projectId/incidents', () => {
    it('creates an incident', async () => {
      // given
      const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();
      const body: CreateIncidentBody = { title: 'Database down' };

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .post(`/projects/${project.id}/incidents`)
        .set('Authorization', `Bearer ${token}`)
        .send(body);

      // then
      expect(response.status).toBe(201);
      expect(await bootstrap.models.incidentModel.findOne()).toMatchObject({ projectId: project.id });
    });
  });
});
```

- One `describe` per route, named `VERB /path`. `// given`, `// when`, `// then` blocks.
- Type request bodies with the `Body` class and cast responses: `response.body as IncidentSerialized`, errors `as ErrorResponse` (`test/utils/error-response.ts`).
- Assert stored state through `bootstrap.models.*`, not only the response.

## Setup helpers

- `bootstrap.utils.generalUtils.setupAnonymous()` returns `{ token, user, cluster, project, apiKey }`. The ingest key is `apiKey.value`.
- `setupClaimed({ userTier: UserTier.Pro })` for paid features. It sets the tier on user, cluster and project.
- A second `setupAnonymous()` is the stranger for 403 tests.
- Domain helpers live in `test/utils/<domain>-utils.ts` and are exposed on `bootstrap.utils`. They either go through the API (`createClaimedHttpMonitor`) or insert directly (`storeHttpMonitor`). Insert directly when the test is not about creation.
  `createClaimedHttpMonitor` throws when the API refuses, so a plan limit fails the test instead of handing back a monitor with `id: undefined`. Plans allow one monitor per project on most tiers; a second monitor in the same project has to be inserted.
- The global `ValidationPipe` rejects unknown fields, so helpers must send only fields declared on the `Body` class (see `HttpMonitorUtils.createClaimedHttpMonitor`).

## Registering new things

In `test/utils/bootstrap.ts`, keep it in sync with `src/app.module.ts`:

- import the new core module,
- fetch its model, `deleteMany({})` it in `clearDatabase`, expose it in `models`,
- new ClickHouse table: add `clickhouseClient.command({ query: 'TRUNCATE TABLE x' })` to `clearDatabase`,
- new logger token: nothing to do, every token in `ALL_LOGGER_TOKENS` is mocked,
- new outbound-DNS or external client: override it with a mock provider like `CustomDomainDnsServiceMock`.

## Outside world, time and async work

- Outbound HTTP: `nock`. `methods.beforeEach()` calls `nock.cleanAll()`, so register interceptors after it (see `test/http-monitors/writes.spec.ts`).
- Stripe: nock cannot intercept the Stripe SDK; the request hangs until the test times out. Spy on the injected client instead: `jest.spyOn(bootstrap.app.get(Stripe).subscriptions, 'list').mockResolvedValueOnce(...)` (see `test/stripe/writes.spec.ts`).
- Time: `jest-date-mock` (`advanceTo`, `advanceBy`). It is reset in `beforeEach`.
- No fixed sleeps. Make the work happen, then assert.
- Crons never fire in tests; `createTestApp` stops them all. Call the method the cron would call: `await bootstrap.app.get(HttpMonitorTtlService).deleteOldUnclaimedMonitors()`.
- Logs and metrics are queued in memory and flushed by those crons. `logUtils.createLog` and `metricUtils.recordMetric` flush before they return. After posting to `/logs` or `/metrics` yourself, call `bootstrap.app.get(LogQueueingService).processQueue()` or `MetricQueueingService.processQueue()`, and `MetricBufferService.flushBuffer()` for ClickHouse metrics.
- Event listeners (`@OnEvent`) run after the request returns. Poll for the state they produce with `waitFor(read, isReady)` from `test/utils/wait-for.ts` (see `test/stripe/writes.spec.ts`).
- Redis TTL windows: expire them with `removeKeysWhichWouldExpireInNextXSeconds` instead of waiting them out.
- Rate limit counters reset in `clearDatabase`. Throttled routes can be tested for their 429.

## What to cover per endpoint

- happy path with stored state,
- each business error with status and message,
- 401 without a token, 403 from another cluster, role and personal-key cases from backend-access-control,
- plan gating with `setupClaimed`,
- not class-validator constraints.
