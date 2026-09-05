# Contributing to Logdash

Thanks for taking the time.
This file is the short version of everything you need to get the stack running and get a change merged.

The commands below are the ones that work today, checked against the repo as it stands rather than copied forward from an older doc.
If one of them fails for you, that is a bug in this file - open an issue or say so in [Discord](https://discord.gg/naftPW4Hxe).

## Prerequisites

- **Node 22.** There is a `.nvmrc` in the repo root, so `nvm use` picks the right version.
- **pnpm 10.7.** The root `package.json` pins `packageManager: pnpm@10.7.0`. `corepack enable` is enough; otherwise `npm i -g pnpm@10.7.0`.
- **Docker.** You need it twice: once for the local datastores (Mongo, Redis, ClickHouse) and once for the backend test suite, which spins up Redis and ClickHouse containers per run.

This is a pnpm workspace with four packages: `apps/backend`, `apps/frontend`, `apps/status-page` and `packages/hyper-ui`.
Commands below name a package with `--filter`, or use a root script where one exists (`pnpm dev:backend`, `pnpm dev:frontend`).

## Running locally

### 1. Install

```bash
nvm use
pnpm install
```

### 2. Start the datastores

```bash
docker compose -f docker-compose.dev.yml up -d --wait
```

Run that from the repo root.
It brings up MongoDB on 27017, Redis on 6379 and ClickHouse on 8123, and `--wait` blocks until they are healthy.
It does not run the apps - you run those from source so you get hot reload.

### 3. Configure the backend

```bash
cp apps/backend/.env.example apps/backend/.env
```

The defaults in that file point at the containers you just started, and every value that would otherwise crash the boot already has a working placeholder.
The backend loads `apps/backend/.env` automatically, so there is nothing else to wire up.

Two things worth knowing about the config, because they look like typos and are not:

- `MONGO_URL` points at the `test` database. `apps/backend/migrate-mongo-config.js` hardcodes `databaseName: 'test'`, so the app has to read the same database the migrations write to.
- `CLICKHOUSE_HOST` is a full URL with scheme and port (`http://localhost:8123`), not a hostname. The client maps `host` straight onto `url`.

### 4. Configure the frontend

```bash
cp apps/frontend/.env.example apps/frontend/.env
```

The example file ships with `VITE_API_BASE_URL=https://api.logdash.io`, which is deliberate - it lets you work on the UI against the production API without running a backend at all.
If you want your local backend instead, change that one line to `http://localhost:3000`.

Everything else in that file is optional.
`VITE_GITHUB_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID` only matter if you have OAuth credentials, which brings us to the next part.

### 5. Run the migrations

```bash
pnpm --filter backend migrate-up
pnpm --filter backend migrate-clickhouse
```

`migrate-up` is `migrate-mongo` over the 28 files in `apps/backend/migrations`.
It is not a declared dependency, so the first run pulls it through `npx`.
`migrate-clickhouse` is `clickhouse-migrations` over `apps/backend/clickhouse-migrations`, and it creates the database itself if it is missing.
Both read `apps/backend/.env`, so step 3 has to come first.

### 6. Start the apps

```bash
pnpm dev:backend   # http://localhost:3000
pnpm dev:frontend                        # http://localhost:5173
```

Run them in two terminals.
The backend watches and restarts on change; the frontend is plain `vite dev`.

### Logging in locally

Be aware of this before you plan a change that needs an authenticated session.

**GitHub OAuth and Google OAuth are the only two login methods.**
There is no email login, no password login and no magic link.
Without a real OAuth app of your own, a local instance cannot sign a normal user in.
Making self-hosting work without borrowed OAuth credentials is tracked in the [Enable self-hosting](https://github.com/logdash-io/logdash.io/issues?q=is%3Aissue+%22Enable+self-hosting%22) issue, and help there is welcome.

There is one way in that does not need credentials: **anonymous accounts.**
`POST /users/anonymous` is a public, unauthenticated endpoint that creates a user, creates a cluster for them and returns a signed JWT.
The landing page already uses it - paste any URL into the form on `/` and you land in a real dashboard at `/app` with logs, metrics and monitoring wired up.
The token expires after 24 hours and the account is reaped, so treat it as a scratch session rather than an account.

That path is enough to develop and review most of the product UI.
It is not enough for anything that reads a claimed account: billing, team invites, cluster ownership transfer, or the OAuth callbacks themselves.

If you only need to hit the API, you can also take the token straight from the endpoint:

```bash
curl -s -X POST http://localhost:3000/users/anonymous
```

## Tests

### Backend

```bash
pnpm --filter backend test
```

**Docker has to be running.**
The suite starts a ClickHouse container and a Redis container in global setup, and runs Mongo through `mongodb-memory-server`, which downloads a `mongod` binary on the first run.
Expect the first run to be slow for that reason.

You do not need `apps/backend/.env` for tests.
`apps/backend/test/utils/setup-env.ts` sets the required variables to test values, and existing values always win, so your `.env` does not interfere either.

### Frontend

```bash
pnpm --filter frontend exec playwright install chromium   # once
pnpm --filter frontend dev --port 5175                    # terminal 1
pnpm --filter frontend test:e2e                           # terminal 2
```

Playwright has no `webServer` block, so it will not start anything for you.
It expects a server already listening on **port 5175** (`apps/frontend/playwright.config.ts`).
Note that this is not the default `vite dev` port, so pass `--port 5175` explicitly.
Override the target with `PLAYWRIGHT_BASE_URL` if you need to point the suite somewhere else.

The e2e suite exercises the anonymous landing flow end to end, so it needs a backend it can create anonymous accounts against.

### Type checking and lint

```bash
pnpm --filter frontend check   # svelte-check
pnpm --filter frontend lint    # prettier --check + eslint
pnpm --filter backend format   # prettier --write over src and test
```

The backend has an `eslint.config.mjs` and a `lint` script, but `eslint` is not among its dependencies, so `pnpm --filter backend lint` does not currently run.
Use `format` until that is fixed.

## Conventions

The full house style is in [`.github/copilot-instructions.md`](.github/copilot-instructions.md).
These are the parts a first-time contributor is most likely to get wrong.

**Code reads like a newspaper.**
Most important logic first, helpers below their first use.
If a component or function is used in a file, define it *after* the usage, not before.
Reading a file top to bottom should tell the story in the order it matters.

**Respect the layers.**
The frontend is organised as `domains/<domain>/{application,domain,infrastructure,ui}`, and the dependency direction runs one way: UI reads application state, application talks to infrastructure, domain holds pure logic.
Do not fetch data from a presentational component.
Keep container components (state, effects, services) separate from presentational ones (props in, markup out).

**Follow the file you are in.**
Naming, folder layout and import style are already decided by the surrounding code.
If you deviate from the pattern, say why in the PR description.

**Prefer clarity over cleverness.**
If a change feels clunky to write, it will feel worse to maintain.

## Pull requests

**Conventional commits.**
The history uses `type(scope): summary` in the imperative, lower case, no trailing period, for example `fix(landing): keep the typed url when the hero form submits before hydration`.
Over the last 200 commits the types are `feat`, `fix`, `chore`, `refactor`, `test`, `docs` and `revert`, and the scopes in use are `frontend`, `landing`, `backend`, `ci`, `security` and `deps`.
The scope is optional and most commits skip it, but the `type:` prefix is not - 166 of the last 200 commits have one, and a PR without it will get a comment.
Match what is already there rather than inventing a new scope.

**One logical change per PR.**
A pure refactor and a behaviour change in the same diff are very hard to review.
Split them.

**Backend behaviour changes need tests.**
There are fixtures for clusters, projects, monitors, logs, metrics, webhooks and users in `apps/backend/test/utils`, so a new case is usually a dozen lines rather than a setup project.

**UI changes need a screenshot.**
Before and after if you are changing something that already exists.

**Say how you tested it.**
"Ran the backend suite" or "clicked through the anonymous flow at 5175" is enough.
"Should work" is not.

## Where to ask

Discord: <https://discord.gg/naftPW4Hxe>.

Bugs and feature requests go through the [issue templates](.github/ISSUE_TEMPLATE).
Security problems do not - see [SECURITY.md](SECURITY.md).
