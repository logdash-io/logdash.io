# Logdash Backend — Credentials & Access

The backend (`apps/backend`, NestJS) is the thing reachable at `https://api.logdash.io`.
This glossary exists because there are **three distinct credentials** that all get
casually called "the API key" — and conflating them has already caused one security
hole. Keep them separate in speech and in code.

## Language

### Credentials

**Personal API Key** (prefix `ldp_`):
A user-owned, named, revocable credential that acts **as that user**. It is scoped
(what kinds of data it can touch) and access-restricted (which clusters/projects it
can reach), but can never exceed what the owning user can do *right now*. This is the
credential the `ld` CLI and the future MCP server present. New in this work order.
_Avoid_: "the API key", "token", "personal token".

**Ingest Key** (new prefix `ldi_`; legacy keys have no prefix):
A **project-scoped, write-only** credential embedded in client SDKs and sent on every
log/metric write, via the HTTP header `project-api-key`. It identifies a *project*, not
a person. It must **never** grant account-level access. Existing.
_Avoid_: "the API key", "project key" (it's the *ingest* key specifically).

**Session Token** (JWT):
A 7-day bearer token minted at login (GitHub/Google). Carries only the user `id` and
implies full access to everything that user owns. Used by the web app.
_Avoid_: "auth token", "bearer" (all three are bearers).

### Authorization concepts

**Scope**:
What *kind* of resource a Personal API Key may touch, and at what level
(`none` / `read` / `write`, where write implies read). Enforced **only** for Personal
API Keys; Session Tokens are implicitly all-access. Example: `logs:read`.

**Access restriction**:
*Which* clusters or projects a Personal API Key may reach. Only ever **narrows** the
owner's live membership — never grants. If the owner loses membership, the key loses
that reach the same instant.

**Reach** (of a Personal API Key):
The live intersection: `owner's current membership ∩ key's scope ∩ key's access
restriction`. Recomputed on every request — nothing is pinned at creation time.

### Product surfaces

**Overview** (REST noun; the CLI verb is `status`):
A cheap, aggregated *verdict* — "is my stuff OK right now?" — over a time window (default 1h):
error counts, monitor up/down, and whether data is still flowing (last log/metric received).
A verdict, not a row dump. Exposed at `GET /overview`, `GET /clusters/:clusterId/overview`,
`GET /projects/:projectId/overview`. The `ld` CLI maps bare `ld` and `ld status` onto it.
_Avoid_: "tldr" (jargon; collides with the tldr-pages tool), "dashboard", "summary".

## Example dialogue

> **Dev:** A customer's ingest key leaked from their mobile app. Blast radius?
> **Domain:** Just that one project's *writes* — someone could spam logs into it.
> An **Ingest Key** can't read anything and can't touch the account. That's the whole
> point of keeping it separate from a **Personal API Key**.
>
> **Dev:** And if someone leaks their `ldp_` key?
> **Domain:** That's worse — it acts *as them*, across their **reach**. But they revoke
> it from the dashboard and it's dead within seconds. And if it was a scoped CLI key,
> the leak is bounded to, say, read-only logs on one cluster — not their whole account.
