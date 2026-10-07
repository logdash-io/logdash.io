import { applyDecorators, UseGuards } from '@nestjs/common';
import { seconds, Throttle, ThrottlerGuard } from '@nestjs/throttler';

/**
 * Throttling is deliberately opt-in (no global APP_GUARD) because the log and
 * metric ingest endpoints are high volume and must never be rate limited here.
 * Apply these decorators only to abuse-prone routes.
 */

export const AccountCreationRateLimit = { limit: 10, ttl: seconds(60) };
export const CliPollingRateLimit = { limit: 30, ttl: seconds(60) };
export const OauthExchangeRateLimit = { limit: 300, ttl: seconds(60) };
export const MonitorCreationRateLimit = { limit: 20, ttl: seconds(60) };
export const MonitorProbeRateLimit = { limit: 30, ttl: seconds(60) };
export const PushPingRateLimit = { limit: 300, ttl: seconds(60) };
export const FaviconRateLimit = { limit: 300, ttl: seconds(60) };
export const FeedbackRateLimit = { limit: 20, ttl: seconds(60) };

function rateLimit(options: { limit: number; ttl: number }) {
  return applyDecorators(UseGuards(ThrottlerGuard), Throttle({ default: options }));
}

/**
 * 10 requests per minute per IP. For endpoints that create users, clusters or
 * issue tokens (anonymous signup, OAuth login/claim, CLI authorization start).
 */
export function ThrottleAccountCreation() {
  return rateLimit(AccountCreationRateLimit);
}

/**
 * 30 requests per minute per IP. For endpoints polled by the CLI while it waits
 * for a device authorization to be approved.
 */
export function ThrottleCliPolling() {
  return rateLimit(CliPollingRateLimit);
}

/**
 * 300 requests per minute, in practice service wide rather than per user.
 *
 * The OAuth login/claim routes are only ever called server to server by the
 * SvelteKit BFF, which does not forward the browser's address, so every user's
 * sign in shares the BFF egress IP and any per-IP budget here is really a cap on
 * the whole product. This one is sized as a crude service wide backstop, not as
 * per user abuse protection - these routes also require a provider issued
 * authorization code, which cannot be minted in bulk. Per user limiting for
 * sign in belongs at the BFF, where the client address is known.
 */
export function ThrottleOauthExchange() {
  return rateLimit(OauthExchangeRateLimit);
}

/**
 * 20 requests per minute per IP. For monitor creation, which the landing page
 * calls straight from the browser, so the client address is the real one and a
 * per-IP budget is a per-visitor budget. Sized well above what a person can do
 * by hand and well below what a script needs to be worth writing.
 */
export function ThrottleMonitorCreation() {
  return rateLimit(MonitorCreationRateLimit);
}

/**
 * 30 requests per minute per IP. For the monitor url probe, which the app calls
 * from the browser while someone types or edits a monitor url, debounced, so a
 * person stays far below it. Each call makes a handful of outbound requests, so
 * the budget also caps how much traffic one address can make us send elsewhere.
 */
export function ThrottleMonitorProbe() {
  return rateLimit(MonitorProbeRateLimit);
}

/**
 * 300 requests per minute per IP. For the public push monitor ping, called by
 * customers' jobs. A push monitor must ping inside every check window (15
 * seconds on Pro), so a heartbeat every 10 seconds fits around 50 monitors
 * behind one NAT address while stopping a single machine
 * from flooding the route with made up ids.
 */
export function ThrottlePushPing() {
  return rateLimit(PushPingRateLimit);
}

/**
 * 300 requests per minute per IP. For the public favicon route, which the app
 * loads straight from the browser for every domain and referrer it lists. The
 * browser caches answers for a day, so a person stays far below it, while one
 * address cannot make us crawl hundreds of sites a minute.
 */
export function ThrottleFavicon() {
  return rateLimit(FaviconRateLimit);
}

/**
 * 20 requests per minute, in practice service wide: the app sends feedback
 * through the SvelteKit BFF, so every user shares its egress IP. Each request
 * posts to the team Telegram chat, which accepts about 20 messages a minute.
 *
 * ponytail: one shared budget, so a single noisy user can block feedback for a
 * minute. Track per user if that ever happens.
 */
export function ThrottleFeedback() {
  return rateLimit(FeedbackRateLimit);
}
