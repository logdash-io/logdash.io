---
name: backend-endpoint
description: Add or change a REST endpoint in the NestJS backend (apps/backend) - route shape, DTOs and validation, Swagger, errors, plan limits, rate limits, audit logging and the tests that go with it. Use when exposing a new operation, adding a field to a request or response, or gating a feature by plan tier.
---

# Backend endpoint

Read `.agents/backend.md` first for DTO naming.
Access control has its own skill, backend-access-control. Every endpoint needs a decision from it.

Reference controller: `apps/backend/src/http-monitor/core/http-monitor-core.controller.ts`.

## Route shape

- Class: `@ApiTags('Incidents')`, `@ApiBearerAuth()`, `@Controller()`. Full paths live on the method decorators.
- Resource segments are snake_case plural: `notification_channels`, `http_monitors`, `public_dashboards`.
- Create and list nest under the owner: `POST /projects/:projectId/incidents`, `GET /clusters/:clusterId/incidents`.
- Item operations are top level: `GET|PUT|DELETE /incidents/:incidentId`.
- Actions are sub-resources: `POST /http_monitors/:httpMonitorId/claim`.
- Param names are camelCase `<resource>Id`. `ClusterMemberGuard` resolves membership from these exact names.
- Verbs: `POST` create, `GET` read, `PUT` update (partial bodies are fine), `DELETE` remove. `PATCH` is not used.

## DTOs and validation

The global `ValidationPipe` runs with `whitelist`, `forbidNonWhitelisted`, `transform` and `enableImplicitConversion` (`src/main.ts`, mirrored in `test/utils/bootstrap.ts`).
Unknown fields are a 400, and query strings are converted to the declared types.

- Controller DTOs: `create-incident.body.ts` -> `CreateIncidentBody`, `read-incidents.query.ts` -> `ReadIncidentsQuery`, custom responses `IncidentsResponse`.
- Write-layer DTOs: `write/dto/create-incident.dto.ts` -> `CreateIncidentDto`, no validators.
- Bound every input: `@MaxLength` on strings, `@ArrayMaxSize` on arrays, `@IsMongoId` on ids.
- Any URL the server will call gets `@IsUrl()` and `@IsSafeUrl()` (`src/shared/ssrf/`). Make the request itself with `safeHttpRequest`.
- Booleans get `@NoImplicitConversion()` before `@IsBoolean()`. Implicit conversion would otherwise turn the string `'false'` into `true` (see `google-login.body.ts`).
- Reusable nested validators live next to their type (`ScopeEntryValidator` in `personal-api-key/core/types/`).

## Handler

```ts
@UseGuards(ClusterMemberGuard)
@Post('projects/:projectId/incidents')
@ApiResponse({ type: IncidentSerialized })
public async create(
  @Param('projectId') projectId: string,
  @Body() dto: CreateIncidentBody,
  @CurrentUserId() userId: string,
): Promise<IncidentSerialized> {
  const project = await this.projectReadService.readByIdOrThrow(projectId);

  if (!(await this.incidentLimitService.hasCapacity(project))) {
    throw new ConflictException('You have reached the maximum number of incidents for this project');
  }

  const incident = await this.incidentWriteService.create(projectId, dto, userId);

  return IncidentSerializer.serialize(incident);
}
```

- The controller orchestrates: load, check, call a write service, serialize. No Mongo or ClickHouse calls in controllers.
- Return `Serialized` types with an explicit return type, `@ApiResponse({ type, isArray })` for lists.
- Deletes return `void` or `SuccessResponse` (`src/shared/responses/`).
- Errors are Nest exceptions with a sentence a user can read. Tests assert on the message.
  `NotFoundException` missing, `ForbiddenException` access or plan, `ConflictException` capacity, `BadRequestException` a semantic rule the validators cannot express.
- A malformed id in the path needs no check. Mongoose throws `CastError` and `CastErrorFilter` (`src/shared/filters/`) turns it into 400 "Invalid id".
  Pass the raw string to Mongoose (`findOne({ _id: id })`). Wrapping it in `new Types.ObjectId(id)` throws a `BSONError` instead, which is a 500.

## Plan limits

Limits and feature flags per tier live in `src/shared/configs/`:
`project-plan-configs.ts` (`getProjectPlanConfig(project.tier)`), `cluster-plan-configs.ts`, `user-plan-configs.ts`.

- New limit: add the field to the config interface, then to every tier entry. TypeScript enforces completeness.
- Capacity checks go in a `limit/` service that returns a boolean (`http-monitor-limit.service.ts`). The controller throws.
- Test gated features with `setupClaimed({ userTier: UserTier.Pro })` and the denial with the default free setup.

## Rate limits

Throttling is opt-in per route, never global: log and metric ingest must stay unthrottled.
Use a decorator from `src/shared/throttling/rate-limit.decorator.ts`, or add a named one there with a comment on who calls the route and why the budget fits.
Apply it only to abuse-prone routes: account creation, token issuing, public creates.

## Side effects

- Writes record audit log entries in the write service (see backend-domain-module).
- Slow or optional follow-up work goes through events (see backend-events-and-crons), not inline in the handler.
- Reads that the public demo dashboard shows get `@DemoEndpoint()` and `@UseInterceptors(DemoCacheInterceptor)`.

## Tests

Add cases to `test/<domain>/reads.spec.ts` or `writes.spec.ts` (see backend-e2e-tests):

- happy path, asserting the response and the stored state,
- each business error with its status and message,
- 403 for a user from another cluster,
- 403 or 200 for personal API keys when the route has `@RequireScope`,
- plan gating when the route checks a tier.
