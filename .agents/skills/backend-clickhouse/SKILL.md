---
name: backend-clickhouse
description: Store and query high-volume or time-series data in ClickHouse from the NestJS backend (apps/backend) - table migrations, snake_case entities, parameterized queries, inserts, retention and tests. Use when adding a ClickHouse table or column, writing analytics or history queries, or deciding between Mongo and ClickHouse for new data.
---

# ClickHouse

## Mongo or ClickHouse

- ClickHouse: append-only, high volume, time ordered, read in ranges or aggregates. Today: `logs`, `metrics`, `http_pings`, `http_ping_buckets`, `audit_logs`.
- Mongo: entities that are edited, looked up by id, or small (see backend-domain-module).

## Migration

Files live in `apps/backend/clickhouse-migrations/` as `<next integer>_<snake_description>.sql`.
They run against production automatically when the folder changes on `main` (`.github/workflows/backend-prod-apply-clickhouse-migrations.yml`).
Never edit a migration that has shipped. Add a new one.

```sql
CREATE TABLE incidents_events (
    id FixedString(24) CODEC(ZSTD),
    project_id FixedString(24) CODEC(ZSTD),
    created_at DateTime64(3) DEFAULT now64(3) CODEC(Delta, ZSTD),
    kind String CODEC(ZSTD),
    message Nullable(String) CODEC(ZSTD)
) ENGINE = MergeTree()
PARTITION BY toYYYYMMDD(created_at)
ORDER BY (project_id, created_at)
SETTINGS index_granularity = 8192;
```

- Ids are Mongo ObjectId hex strings in `FixedString(24)`.
- `ORDER BY` starts with the column every query filters on (the owner id), then time. Only `audit_logs` is ordered by time first.
- Daily partitions for high-volume data with retention, monthly for low volume (`audit_logs`).
- New column on an existing table: `ALTER TABLE x ADD COLUMN IF NOT EXISTS ...` (see `8_add_namespace_to_logs.sql`).

Apply locally with `pnpm --filter backend migrate-clickhouse`.

Two traps in the test setup (`test/utils/clickhouse-test-container-server.ts`):

- The test container mounts this folder as `docker-entrypoint-initdb.d` and is started with `withReuse()`. Init scripts only run when the container is created, so after adding a migration remove the old container (`docker ps` shows a `clickhouse/clickhouse-server:latest` container with a random name) or your new table will not exist in tests.
- The entrypoint runs the files in shell glob order, not numeric order. `10_*.sql` sorts before `2_*.sql`, so check the order before adding the tenth migration.

## Code

Reference: `src/http-ping/` (entity, serializer, read and write services, TTL).

- The entity mirrors the row in snake_case and has `static fromNormalized(normalized)`. Dates go through `ClickhouseUtils.jsDateToClickhouseDate` (`src/clickhouse/clickhouse.utils.ts`), and come back through `clickhouseDateToJsDate` in the serializer.
- Generate ids in code: `new Types.ObjectId().toString()`.
- Inject the global client: `constructor(private readonly clickhouse: ClickHouseClient) {}`.
- Insert: `await this.clickhouse.insert({ table: 'http_pings', values, format: 'JSONEachRow' })`. Return early on an empty array.
- Select: `await this.clickhouse.query({ query, query_params })`, then `const { data } = await result.json<XEntity>()`.
- Every value goes through a typed placeholder: `{projectId:FixedString(24)}`, `{ids:Array(FixedString(24))}`, `{date:DateTime64(3)}`, `{limit:UInt64}`. Never interpolate strings into SQL.
- Statements without a result set (`DELETE`, `ALTER`, `TRUNCATE`) use `this.clickhouse.command(...)`. `query()` leaves the response undrained.
- Retention is a cron that calls `deleteOlderThan(cutoff)` (`http-ping-ttl.service.ts`), with the window from a plan config or `getEnvConfig()`.
- Per-request writes on hot paths are batched, not inserted one by one. See the log queue (`src/log/queueing/`) and the metric buffer (`src/metric/buffer/`).
- Removal: delete the rows when the owner goes away (`HttpPingWriteService.deleteByMonitorIds`, called from the monitor removal service).

## Tests

- Add `clickhouseClient.command({ query: 'TRUNCATE TABLE x' })` to `clearDatabase` in `test/utils/bootstrap.ts`.
- Read rows back in specs with `bootstrap.clickhouseClient`.
- Direct inserts are visible as soon as `insert()` resolves. Queued writes (logs, metrics) land when their queue is flushed, which tests do explicitly (see backend-e2e-tests).
