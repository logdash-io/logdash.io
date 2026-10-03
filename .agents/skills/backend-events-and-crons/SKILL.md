---
name: backend-events-and-crons
description: Add background work to the NestJS backend (apps/backend) - domain events with EventEmitter2, @OnEvent listeners, @Cron jobs such as TTL cleanup, fire-and-forget side effects, and namespaced Logdash loggers. Use when something should happen after an action ("when a ping fails, notify"), on a schedule ("delete X older than Y"), or when adding logging to a new area.
---

# Events, crons and logging

## Events

Each emitting domain has an `events/` folder. Reference: `src/http-ping/events/`.

```
src/<domain>/events/
  <domain>-event.enum.ts           enum HttpPingEvent { HttpPingCreatedEvent = 'http-ping.created' }
  definitions/<name>.event.ts      interface with the payload, ids as strings
  <domain>-event.emitter.ts        one typed emitXEvent(payload) method per event
  <domain>-event.module.ts         @Global() module exporting the emitter
```

- Event values are `'<domain>.<past-tense>'`.
- Import the event module once, in the module of the service that emits (`LogCoreModule` imports `LogEventModule`). It is global, so listeners need no import.
- Emit through the typed emitter, never `eventEmitter.emit('string', ...)` directly.
- Payloads carry what listeners need to filter cheaply (`clusterId`, `projectId`), so SSE streams and listeners do not have to query first.

Listener (`src/http-monitor/status/http-monitor-status-change.service.ts`):

```ts
@OnEvent(HttpPingEvent.HttpPingCreatedEvent)
public async tryHandleHttpPingCreatedEvent(event: HttpPingCreatedEvent): Promise<void> {
  try {
    await this.handleHttpPingCreatedEvent(event);
  } catch (error) {
    this.logger.error('Error handling http ping created event', { error: errorMessage(error), event });
  }
}
```

- Always wrap the listener body. A throwing async listener becomes an unhandled rejection that nobody sees.
- Keep the real work in a public method so tests can call it directly.
- Tests cannot await a listener. They poll for the state it writes (see backend-e2e-tests).
- The listener service must be a provider in a module that is loaded by `app.module.ts` and by `test/utils/bootstrap.ts`.
- Events are in-process. They are lost on restart and not shared between instances. Anything that must happen goes to the database first.

## Crons

Reference: `src/http-monitor/ttl/http-monitor-ttl.service.ts`.

```ts
@Cron(CronExpression.EVERY_MINUTE)
public async runCron(): Promise<void> {
  await this.deleteOldUnclaimedMonitors();
}
```

- Put crons in their own submodule (`ttl/`, or a named job folder) with the service as a provider.
- The `@Cron` method only guards and delegates. Tests call the delegate: `bootstrap.app.get(HttpMonitorTtlService).deleteOldUnclaimedMonitors()`.
- E2E tests stop every cron (`test/utils/bootstrap.ts`), so no `NODE_ENV` guard is needed. The guards in older crons predate that.
- During a deploy the old and new backend run side by side for a few seconds. A cron that writes shared data, pings or notifies claims the tick first, with a ttl just under its interval, so only one instance runs it:

  ```ts
  if (!(await this.redisService.claimCronTick('http-ping-pinger:15s', 10_000))) {
    return;
  }
  ```

  Per-instance work, like flushing an in-memory queue, does not claim. Idempotent deletes (`ttl/`) do not need to.
- Loop with a `try/catch` per item and log failures, so one bad record does not stop the batch.
- Stream large sets with a cursor (`readUnclaimedUserIdsCreatedBeforeCursor` in `user-ttl.service.ts`).
- Read windows and limits from `getEnvConfig()` or a plan config, not literals scattered in the job.

## Fire and forget

- Audit log writes: `void this.auditLog.create(...)`. `AuditLog.create` catches and logs its own errors.
- Anything else started with `void` must catch its own errors, like `touchLastUsed` in `personal-api-key-auth.service.ts`.
- Delayed work in a request (`setTimeout`) is skipped when `NODE_ENV === 'test'`.

## Logging

Loggers are namespaced Logdash instances injected by token:

```ts
constructor(@Inject(HTTP_MONITORS_LOGGER) private readonly logger: LogdashLogger) {}

this.logger.log('Deleted unclaimed monitor', { httpMonitorId, projectId });
this.logger.error('Failed to delete unclaimed monitor', { httpMonitorId, error: errorMessage(error) });
```

- Reuse the domain's token from `src/shared/logdash/logdash-tokens.ts`.
- A new area gets a new token: add the symbol, add it to `ALL_LOGGER_TOKENS` and `NAMESPACE_MAP`, and register `createNamespacedLoggerProvider(TOKEN)` in `logdash.module.ts`. Tests mock every token in `ALL_LOGGER_TOKENS` automatically.
- Log ids and short messages. Never log tokens, keys, full webhook urls, header values or request bodies (see `webhook.notification-channel-provider.ts` and `redact-secrets.ts`).
- Pass errors through `errorMessage(error)` from `src/shared/utils/error-message.ts`.
