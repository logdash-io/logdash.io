---
name: backend-access-control
description: Decide and implement who can call a backend endpoint in apps/backend - session tokens, personal API keys (ldp_ scopes and access restrictions), ingest keys, cluster roles, public routes, and extending ClusterMemberGuard for a new id param. Use for any new or changed route, when exposing something to the ld CLI or MCP, or when reviewing an endpoint for authorization holes.
---

# Backend access control

Background, read when unsure: `apps/backend/CONTEXT.md` (the three credentials), `apps/backend/docs/adr/0002-personal-api-key-permission-model.md`.

## How a request is authorized

1. `AuthGuard` (`src/auth/core/guards/auth.guard.ts`) is a global `APP_GUARD` and runs on every route.
   `@Public()` skips it.
   Otherwise it needs `Authorization: Bearer <token>`:
   an `ldp_` token is a personal API key, verified and scope-checked;
   anything else is a session JWT with all scopes.
   It sets `request.user = { id, scopes, access, viaPersonalKey }`.
2. `ClusterMemberGuard` (`src/cluster/guards/cluster-member/cluster-member.guard.ts`) is opt-in with `@UseGuards`.
   It takes the first known id param, resolves the owning cluster, and checks the caller's role, `@RequireRole`, and the personal key's access restriction.
3. The handler covers whatever the guards cannot see.

## Pick the decorators

| Route kind | Decorators |
| --- | --- |
| Cluster or project owned, id in path | `@UseGuards(ClusterMemberGuard)` |
| Needs a higher role | add `@RequireRole(ClusterRole.Creator, ClusterRole.Admin)`. Without it every role passes. |
| The `ld` CLI or MCP should reach it | add `@RequireScope(Resource.X, Action.Read, Action.Write or Action.Delete)` |
| Account level or key management | nothing extra. Session only by design. |
| SDK ingest | `@Public()`, `@ApiSecurity('project-api-key')`, `@Headers('project-api-key')`, resolve with `ApiKeyReadCachedService.readProjectId` (see `log-core.controller.ts`) |
| Truly public (status page, badge, webhook) | `@Public()`, look up by an unguessable key, return only public data, verify webhook signatures |
| Internal admin | `@Public()` plus `@UseGuards(AdminGuard)` (see `subscription-core.controller.ts`) |
| Public demo dashboard reads | add `@DemoEndpoint()` and `@UseInterceptors(DemoCacheInterceptor)` on top of the guard |

Read the caller with `@CurrentUserId()`. Use `@Req() request: AuthenticatedRequest` only when you need `access`.

## Personal API key rules

- Fail closed: a personal key calling a route without `@RequireScope` gets 403.
  Leaving the annotation off is the safe default. Add it only for routes the CLI or MCP needs.
- Levels are `none < read < write < delete`, and each includes the ones below it. A write route annotated `Action.Read` is a hole.
- Irreversible routes (hard deletes, anything that wipes history) use `Action.Delete`, not `Action.Write`.
- Raise `MAX_GRANT` in `src/personal-api-key/core/scope-presets.ts` when you annotate a new resource or a new level.
  Keys can only be created up to `MAX_GRANT`, so until you raise it nobody can hold the new permission, and old keys never gain it by accident.
- Never let a personal key or an ingest key create, list or revoke keys.

## Traps

- **No id param, no guard.** Aggregate routes like `GET /overview` never run `ClusterMemberGuard`.
  The handler must bound the result to live membership intersected with the key's access restriction.
  Copy `resolveReachableProjects` in `src/overview/core/overview-core.controller.ts`.
- **Only the first id is checked.** For `projects/:projectId/monitors/:monitorId/...` the guard checks `projectId` only.
  The handler must prove the child belongs to the parent (`readByMonitorIdQuery` in `http-ping-core.controller.ts`) or filter by both ids in the query (`removeById` in `metric-register-write.service.ts`).
- **Ids in the body are not checked.** Verify every referenced id belongs to the same cluster, like `validateNotificationChannels` in `http-monitor-core.controller.ts`.
- **`@DemoEndpoint()` opens the route to everyone for the demo ids.** On those routes the demo project and cluster from `getEnvConfig().demo` skip both authentication and membership, and the ids are public (`GET /demo`).
  Mark only reads the landing demo shows, never anything that returns secrets such as ingest keys or channel options.
  The one marked write, `POST projects/:projectId/test-log`, is rate limited. Do not add more.

## New id param in ClusterMemberGuard

When a new resource gets item routes (`/incidents/:incidentId`):

1. Add `INCIDENT_ID_PARAM_NAME = 'incidentId'`.
2. Add `IncidentReadModule` to `ClusterMemberGuardImports` and inject `IncidentReadService`.
3. Read the param in `canActivate`, include it in the "none provided" check, and branch to a new `checkForIncidentId`.
4. In `checkForIncidentId`, resolve the owning `clusterId` (through the project when the resource is project owned), check the role exactly like `checkForHttpMonitorId`, then call `assertAccessAllows` with both `clusterId` and `projectId`.
   Passing `projectId` is what lets project-restricted keys reach the route.
5. The read module must not import cluster modules, or the guard creates an import cycle.

## Tests

Put these next to the feature specs (see backend-e2e-tests):

- 401 without a token,
- 403 for a user from another cluster (`const setupB = await bootstrap.utils.generalUtils.setupAnonymous()`),
- 403 for a role below `@RequireRole`,
- for `@RequireScope` routes: 200 with the scope, 403 without it, 403 with an access restriction that excludes the target.

`test/personal-api-keys/personal-api-key-permissions.spec.ts` has the `createKey` and `addMember` helpers to copy.
