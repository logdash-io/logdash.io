# CLI device authorization flow (link + glance code + poll, no callback)

**Context:** `ld login` must obtain a Personal API Key with minimal friction, while working
over SSH / headless / containers where a localhost callback is unreachable. A pure
loopback-callback handoff was rejected for that reason; pure key-paste was rejected as too
much friction.

**Decision:** A device-authorization flow with three endpoints and a short-lived Redis
pending-authorization record:
- `POST /auth/cli/start` (public) → issues `deviceCode` (secret, ~144-bit, base62) and
  `userCode` (short, glanceable, ≥40-bit, unambiguous alphabet), TTL 10 min, poll interval.
- `POST /auth/cli/approve` (session-JWT-gated) → user opens the magic link
  (`/app/authorize-cli?user_code=…`), the consent modal auto-opens pre-filled (CLI-default
  preset), the user **glances** the code matches their terminal, clicks Create; the backend
  mints a Personal API Key owned by the session user and stores its value against the record.
- `POST /auth/cli/poll` (public; authed by possession of `deviceCode`) → returns
  `pending | approved+value(once) | denied | expired`. Delivery is one-time, then the record
  is destroyed. The CLI auto-polls; no callback, no key typed by the human.

**The two security invariants (what makes it not-a-hole):**
1. **Retrieval is gated only by `deviceCode`** (high-entropy, held solely by the initiating
   CLI), NEVER by `userCode`. `userCode` only locates a record for approval + human glance.
2. **`userCode` is moderate-entropy + 10-min TTL + rate-limited approve lookups**, so the
   token-injection attack (approving a victim's pending record) is infeasible to script.
The visible glance-code (shown in both terminal and modal) defeats phishing: a remote
attacker can't make the victim's terminal display the attacker's code.

**Why not callback / not paste:** callback can't reach the CLI host over SSH; paste is the
friction we set out to remove. Device flow + auto-poll needs nothing to connect back.

**Consequences:** `/auth/cli/start|poll` are `@Public()`; `/auth/cli/approve` is session-only
(a Personal API Key hitting it gets 403 — key-management stays session-only, consistent with
[[0002]]). The plaintext key lives in Redis only until first poll (≤10 min), then is deleted.
Residual: device flow can't fully stop real-time social-engineering ("read me your code");
mitigated by the consent modal, short TTL, and the read-only default key — the industry
ceiling (GitHub's device flow shares it). Re-introduces the "dead" device flow the work
order's §11 referenced, built properly this time.
