---
name: backend-domain-module
description: Scaffold a new Mongo-backed domain module in the NestJS backend (apps/backend) - entity, serializer, read/write/removal services, core controller, wiring and tests. Use when adding a new resource or feature area to the backend ("add incidents", "store X per project", "new backend module").
---

# New backend domain module

Read `.agents/backend.md` first. It holds the naming and testing rules this skill builds on.

Copy the shape of `apps/backend/src/http-monitor/`. It is the most complete example.
`apps/backend/src/api-key/` is a smaller one.

## Layout

One folder per domain, kebab-case singular (`http-monitor`, `notification-channel`).
Inside it, one Nest module per responsibility.
Create only the submodules the feature needs.

```
src/<domain>/
  core/
    <domain>-core.module.ts         controller + submodule imports
    <domain>-core.controller.ts     HTTP surface: access, validation, orchestration
    dto/                            controller DTOs: *.body.ts, *.query.ts, *.response.ts
    entities/
      <domain>.entity.ts            Mongoose schema
      <domain>.interface.ts         <Domain>Normalized + <Domain>Serialized
      <domain>.serializer.ts        entity -> normalized -> serialized
    enums/
  read/      <domain>-read.module.ts, <domain>-read.service.ts, optional <domain>-read-cached.service.ts
  write/     <domain>-write.module.ts, <domain>-write.service.ts, dto/*.dto.ts
  removal/   cascade deletes that touch other domains
  limit/     plan capacity checks returning booleans
  ttl/       cron cleanup (see backend-events-and-crons)
  events/    emitter, enum, definitions (see backend-events-and-crons)
```

Other domains import `<Domain>ReadModule` or `<Domain>WriteModule`, never the core module.
Core modules are imported only by `src/app.module.ts` and `test/utils/bootstrap.ts`.

## Data shapes

Three shapes, always in this direction: `Entity` -> `Normalized` -> `Serialized`.

- `XEntity` is the Mongo document class. It never leaves read/write services.
- `XNormalized` is the internal plain object with a string `id`. Services return it and take it.
- `XSerialized` is the API response. Every field has `@ApiProperty`/`@ApiPropertyOptional`.
- `XSerializer` has static `normalize`, `normalizeMany`, `serialize`, `serializeMany`.
  `serialize` is where secrets and internal fields get dropped (see `notification-channel.serializer.ts`).

## Entity

```ts
@Schema({ collection: 'incidents', timestamps: true })
export class IncidentEntity {
  _id: Types.ObjectId;

  @Prop({ required: true })
  projectId: string;

  @Prop({ required: true, enum: IncidentStatus, default: IncidentStatus.Open })
  status: IncidentStatus;

  createdAt: Date;
  updatedAt: Date;
}

export type IncidentDocument = HydratedDocument<IncidentEntity>;

export const IncidentSchema = SchemaFactory.createForClass(IncidentEntity);

IncidentSchema.index({ projectId: 1, createdAt: -1 });
```

- `collection` is camelCase plural.
- Foreign keys are plain `string` ids (`projectId`, `clusterId`), not ObjectId refs or populate.
- Every production index also gets a Mongo migration (see backend-mongo-migration).

## Read and write services

- Each of `read/` and `write/` registers the model itself with `MongooseModule.forFeature([{ name: XEntity.name, schema: XSchema }])`.
- Inject with `@InjectModel(XEntity.name) private readonly xModel: Model<XEntity>`.
- Reads use `.lean<XEntity>().exec()` and return `XSerializer.normalize(...)`.
- `readById` returns `null` on a miss. Add `readByIdOrThrow` throwing `NotFoundException` when callers need it.
- Streams over large sets use an `async *` generator over `.cursor()` (see `readManyUnclaimedCursorWithMode` in `http-monitor-read.service.ts`).
- Writes take an optional `actorUserId` and record an audit log entry:

```ts
void this.auditLog.create({
  userId: actorUserId,
  actor: actorUserId ? Actor.User : Actor.System,
  action: AuditLogEntityAction.Create,
  relatedDomain: RelatedDomain.Incident,
  relatedEntityId: entity._id.toString(),
});
```

`AuditLog` comes from a global module, so no import is needed.
Add the new value to `src/audit-log/core/enums/related-domain.enum.ts`.

## Cached reads

Add `<domain>-read-cached.service.ts` only for reads on a hot path (guards, ingest, per-request lookups).
Follow `src/project/read/project-read-cached.service.ts`:

- Redis key `<domain>:<id>`, TTL 5-10 seconds.
- Cache a miss as the string `'null'` so missing ids do not hammer Mongo.
- There is no invalidation. The short TTL is the invalidation strategy, so never cache anything where 10 seconds of staleness is a security or billing problem.

## Wiring checklist

1. `src/app.module.ts`: import `<Domain>CoreModule`.
2. `test/utils/bootstrap.ts`: import the core module, fetch the model with `module.get(getModelToken(XEntity.name))`, add `xModel.deleteMany({})` to `clearDatabase`, expose it in `models`.
3. Removal cascade. Project-owned data: call your removal service from `ProjectRemovalService.deleteProjectById` (`src/project/removal/`) and import your removal module there. Cluster-owned data: `ClusterRemovalService`, in both `deleteClusterById` and `deleteClustersByCreatorId` (the second one runs when expired anonymous users are deleted).
4. Access: routes with a new id param (`:incidentId`) need `ClusterMemberGuard` support (see backend-access-control).
5. Logging: inject an existing token from `src/shared/logdash/logdash-tokens.ts`, or add a new one (see backend-events-and-crons).
6. Tests: `test/<domain>/reads.spec.ts` and `writes.spec.ts` (see backend-e2e-tests).

## Verify

```bash
pnpm --filter backend check
pnpm --filter backend lint
pnpm --filter backend test test/<domain>
```
