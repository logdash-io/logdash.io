import { applyDecorators, UseGuards } from '@nestjs/common';
import { seconds, Throttle, ThrottlerGuard } from '@nestjs/throttler';

/**
 * Throttling is deliberately opt-in (no global APP_GUARD) because the log and
 * metric ingest endpoints are high volume and must never be rate limited here.
 * Apply these decorators only to abuse-prone routes.
 */

export const AccountCreationRateLimit = { limit: 10, ttl: seconds(60) };
export const CliPollingRateLimit = { limit: 30, ttl: seconds(60) };

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
