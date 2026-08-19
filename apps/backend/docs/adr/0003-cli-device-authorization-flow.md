# CLI device authorization flow (typed code + poll, no callback, no magic link)

**Context:** `ld login` must obtain a Personal API Key with minimal friction, while working
over SSH / headless / containers where a localhost callback is unreachable. A pure
loopback-callback handoff was rejected for that reason; pure key-paste was rejected as too
much friction.

**Decision:** A device-authorization flow with four endpoints and a short-lived Redis
pending-authorization record:
- `POST /auth/cli/start` (public) → issues `deviceCode` (secret, ~144-bit, base62) and
  `userCode` (short, ≥40-bit, unambiguous alphabet), TTL 10 min, poll interval, plus a bare
  `verificationUri`. The initiating client's IP (socket peer address) and user-agent are
  recorded on the pending record.
- `POST /auth/cli/lookup` (session-JWT-gated) → the user opens `verificationUri`, **types**
  the code from their terminal, and gets back the requesting IP / user-agent / timestamp to
  check before granting anything.
- `POST /auth/cli/approve` (session-JWT-gated) → the user makes an **explicit** access choice
  (there is no `{kind:'all'}` default) and confirms; the backend mints a Personal API Key
  owned by the session user, **with a mandatory 30-day expiry**, and stores its value against
  the record.
- `POST /auth/cli/poll` (public; authed by possession of `deviceCode`) → returns
  `pending | approved+value(once) | denied | expired`. Delivery is one-time, then the record
  is destroyed. The CLI auto-polls; no callback, no key typed by the human.

**The three security invariants (what makes it not-a-hole):**
1. **Retrieval is gated only by `deviceCode`** (high-entropy, held solely by the initiating
   CLI), NEVER by `userCode`. `userCode` only locates a record for approval + human check.
2. **`userCode` is moderate-entropy + 10-min TTL + rate-limited lookups**: every
   `userCode` → record resolution (lookup, approve, deny alike) spends from a per-session-user
   budget of 20 attempts / 10 min, hits and misses alike, so the token-injection attack
   (approving a victim's pending record) is infeasible to script. The two public endpoints
   carry per-IP throttles on top (`ThrottleAccountCreation` on `start`, `ThrottleCliPolling`
   on `poll`).
3. **The `userCode` is never carried in a URL.** `start()` returns no
   `verificationUriComplete`, and the consent page ignores query parameters: the input starts
   empty and the user transcribes the code from their own terminal. A pre-filled code turns
   the "does this match your terminal?" check into a rubber stamp, which is precisely the
   phishing hole a magic link opens — an attacker starts the flow on their own machine and
   mails the victim a genuine `logdash.io` link that grants the attacker a key on one click.

**Why not callback / not paste:** callback can't reach the CLI host over SSH; paste is the
friction we set out to remove. Device flow + auto-poll needs nothing to connect back.

**Consequences:** `/auth/cli/start|poll` are `@Public()`; `/auth/cli/lookup|approve|deny` are
session-only (a Personal API Key hitting them gets 403 — key-management stays session-only,
consistent with [[0002]]). The plaintext key lives in Redis only until first poll (≤10 min),
then is deleted. The CLI must print the `userCode` and the bare `verificationUri` and tell
the user to type the code; it can no longer auto-open a pre-filled link. The displayed client
IP comes from `@Ip()` resolved through express `trust proxy` (set in `main.ts`);
`x-forwarded-for` is deliberately **not** read by hand, since a forgeable "requesting machine"
on the consent screen is worse than showing none. The displayed user-agent is self-reported
by the initiating client and is labelled as such in the UI. Residual: device flow can't fully
stop real-time social-engineering ("read me your code"); mitigated by the typed code, the
displayed origin, the short TTL, the explicit access choice, the mandatory key expiry, and
the read-only default scope preset — the industry ceiling (GitHub's device flow shares it).
