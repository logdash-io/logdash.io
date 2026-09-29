# Personal API Key permission model: narrows-never-grants, recomputed live, fail-closed

**Context:** Personal API Keys give the `ld` CLI and a future MCP server scoped, revocable
credentials. We need a permission model that is safe by default and impossible to escalate.

**Decision:**
- A key carries **scopes** (per-resource `none`/`read`/`write`, write⇒read) and an **access
  restriction** (`all` | `clusters[ids]` | `projects[ids]`).
- **Effective reach = owner's live membership ∩ scope ∩ access restriction**, recomputed on every
  request (membership read live via the existing 5s role cache). Nothing is pinned at creation — lose
  cluster membership and the key loses it the same instant; regain it and the key regains it (no v2
  quarantine).
- **Scopes are enforced only for `ldp_` keys**; Session Tokens (JWT) are implicitly all-access and
  ignore scope annotations.
- **Fail-closed:** a personal key hitting an endpoint with no `@RequireScope` gets 403. Only the
  CLI/MCP read surface is annotated; everything else is denied by default. (Practical effect at launch:
  personal keys are **read-only** — no write endpoint is annotated yet.)
- **Key-management is Session-Token-only.** A personal key can never create/list/revoke keys. This is
  the exact hole that `POST /auth/api-key` (now deleted) opened: an ingest credential must never mint a
  full-access credential.

**Why:** Dynamic intersection means a key can never grant access the user doesn't currently have, so
revocation/off-boarding needs no key bookkeeping. Fail-closed means we annotate only what the CLI uses
instead of auditing the whole codebase, and a forgotten annotation denies rather than leaks.

**Consequence:** Param-less aggregate endpoints (`GET /overview`, `GET /personal-api-keys`) bypass
`ClusterMemberGuard`, so they MUST filter by the key's reach in the handler. Every new aggregate
endpoint needs that check called out in review.

## Amended (2026-09): delete level and `MAX_GRANT`

**Context:** Annotating the monitor write routes with `monitors:write` also gave that scope the hard delete of monitors and their history.
The "All access" preset stored `write` on every resource, including resources with no key routes.
So every old "All access" key picked up monitor delete as soon as the routes were annotated.

**Decision:**
- Scope levels are `none < read < write < delete`, and each level includes the ones below it.
  `write` covers create, update, claim and linking channels. `delete` adds permanent deletion.
  Irreversible routes use `Action.Delete`.
- `Resource` lists only resources that have key routes: `logs`, `metrics`, `monitors`, `projects`, `clusters`, `account`.
- `MAX_GRANT` in `scope-presets.ts` is the highest level each resource supports (monitors `delete`, the rest `read`).
  Creating a key above it returns 400, for `POST /personal-api-keys` and `ld login` alike.
  Raise an entry on purpose when a route is annotated at a new level, so old keys never gain a permission by accident.
- The migration `20260928120000-clamp-personal-api-key-scopes.js` dropped entries for removed resources and capped the rest at `MAX_GRANT`.
  Existing `monitors:write` keys lost delete.
