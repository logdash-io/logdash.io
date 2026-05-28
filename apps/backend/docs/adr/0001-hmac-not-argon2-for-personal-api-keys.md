# HMAC-SHA256, not argon2id, for Personal API Key verification

**Context:** Personal API Keys (`ldp_` + base62(`randomBytes(24)`), ~144 bits) are verified on
*every* request, with the stored hash cached in Redis but the secret compare run on each hit.

**Decision:** Store `HMAC-SHA256(value, serverSecret)` (hex) and compare with
`crypto.timingSafeEqual`. The secret lives in env/secret config (`getEnvConfig()`), never in Mongo.
Reject argon2id.

**Why:** argon2's slowness/memory-hardness only buys security against *low-entropy* secrets;
against a 144-bit CSPRNG token, brute force is already infeasible, so it adds zero real protection
while imposing tens-to-100ms CPU + memory cost per request on a high-RPS CLI/MCP hot path (a
self-inflicted DoS) plus a native node-gyp build dependency. HMAC is microsecond-fast, dependency-free,
and its server-side key acts as a pepper: a database-only leak yields digests that cannot even be
verified offline. This is how GitHub/Stripe/AWS hash high-entropy API keys. (7-of-7 independent
reviewers concurred.)

**Consequence:** A new required secret (`PERSONAL_API_KEY_HMAC_SECRET`) must exist in every
environment. Rotating it invalidates all existing keys (acceptable; revocation-by-rotation is a feature).
