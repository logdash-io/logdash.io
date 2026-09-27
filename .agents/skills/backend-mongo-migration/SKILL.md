---
name: backend-mongo-migration
description: Write a MongoDB migration for the NestJS backend (apps/backend/migrations, migrate-mongo) - indexes, backfills for new fields, renames and data fixes. Use when adding or changing a field on an existing Mongo entity, adding an index, or correcting stored data.
---

# Mongo migration

Migrations use migrate-mongo and live in `apps/backend/migrations/`.
They run automatically against production when a change under that folder reaches `main` (`.github/workflows/backend-prod-apply-mongo-migrations.yml`).
So a merged migration runs on real data without a manual step. Write it to be safe to run twice.

## When you need one

- New index: declare it on the schema (`XSchema.index(...)`) and add a migration. Every production index in this repo has one.
- New required field or new default: set it on the entity `@Prop` for new documents, and backfill existing ones. Reads use `.lean()`, so Mongoose defaults never fill in old documents.
- Renamed or reshaped field: migration plus code that reads the new shape only.
- Not needed for a new collection. Mongoose creates it on first write.

## File

Name: `YYYYMMDDHHMMSS-kebab-description.js`, with a timestamp later than every existing file. Files run in name order.
CommonJS, no TypeScript, no imports from `src/`.
The collection name comes from `@Schema({ collection })` on the entity.

Index (`20250504172982-http-monitors-claimed-createdAt-index.js`):

```js
async function up(db) {
  await db.collection('httpMonitors').createIndex({ claimed: 1, createdAt: -1 });
}

async function down(db) {
  await db.collection('httpMonitors').dropIndex({ claimed: 1, createdAt: -1 });
}

module.exports = { up, down };
```

Backfill (`20260924120000-add-badge-key-to-http-monitors.js`):

- Stream with a cursor and a `projection`, never load the whole collection.
- Write with `bulkWrite` in batches of 500.
- Put the "not done yet" condition in the update filter too (`badgeKey: { $exists: false }`), so reruns and races are harmless.
- Generate per-document values in the loop (`randomBytes(9).toString('base64url')`), not once for all documents.

Write `down` when it is cheap and exact. Leave it empty only when reversing would lose data.

## Run and verify

Against the local Docker Mongo from `docker-compose.dev.yml`, with `apps/backend/.env` in place:

```bash
cd apps/backend
npx migrate-mongo status
pnpm --filter backend migrate-up
```

`migrate-mongo-config.js` hardcodes the `test` database, which is why `MONGO_URL` points at it too.
E2E tests use an in-memory Mongo that never runs migrations, so they only see schema indexes and defaults.
Check the migrated data by hand in `mongosh` before opening the PR.
