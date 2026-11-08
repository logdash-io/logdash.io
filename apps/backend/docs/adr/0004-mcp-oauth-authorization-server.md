# MCP authorization through an OAuth consent screen

**Context:** Coding agents speak MCP and support OAuth.
A personal API key forces the user to create a key in the dashboard, copy it, and paste it into an agent config.
The expected flow is the one other MCP servers use: the client opens Logdash in the browser, the user approves or declines, and the agent connects.

**Decision:** The backend acts as an OAuth 2.1 authorization server for the MCP resource.
- `/.well-known/oauth-protected-resource` and `/.well-known/oauth-protected-resource/mcp` describe the MCP resource, and a 401 from `/mcp` carries `WWW-Authenticate: Bearer resource_metadata="..."`.
- `/.well-known/oauth-authorization-server` advertises the frontend consent page, the token endpoint and the registration endpoint.
- `POST /oauth/register` performs dynamic client registration for public clients (`token_endpoint_auth_method=none`), with redirect URIs restricted to https or a loopback address.
- The frontend page `/app/authorize-mcp` shows the client name, the redirect host and the requested scopes, and the user approves or declines.
- `POST /oauth/token` requires PKCE S256 and a single-use code that lives for two minutes.
- The token exchange mints a Personal API Key with a mandatory 30-day expiry, `access: all`, and the requested `webAnalytics:read` or `webAnalytics:write` scope. The key value is returned as the OAuth access token.

**Why a Personal API Key as the token:** The guard, the scope enforcement, the revoke path and the API keys screen already exist. The token is revocable there, and no second credential type can drift from the first.

**Security invariants:**
- The redirect URI must match a registered client exactly.
- PKCE S256 is mandatory. The verifier is checked at exchange, and the code is consumed on the first attempt.
- The consent record is bound to the session user who opened it.
- The consent record lives for ten minutes, and the code lives for two minutes.
- The token endpoint returns OAuth errors, never session data.
- The consent page never receives or displays the API key.

**Consequences:** The API key screen lists every MCP authorization as `MCP (<client name>)`, and revoking it disconnects the agent.
There is no refresh token; the agent runs the consent flow again when the 30-day key expires or is revoked.
Dynamic client registrations live in Redis for 30 days.
Clients without an OAuth flow can keep using a personal API key header.
