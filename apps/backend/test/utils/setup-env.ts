/**
 * Test-run environment defaults.
 *
 * `OUR_ENV` and `PERSONAL_API_KEY_HMAC_SECRET` are required at runtime - the
 * config layer deliberately throws when they are missing rather than falling
 * back to a hardcoded pepper. These defaults keep `pnpm test` working without
 * a local `.env`, and mirror the values the CI test action already sets.
 *
 * Existing values always win, so CI stays authoritative.
 */
const TEST_ENV_DEFAULTS: Record<string, string> = {
  OUR_ENV: 'local',
  AUTH_JWT_SECRET: 'test',
  PERSONAL_API_KEY_HMAC_SECRET: 'test',
  TELEGRAM_UPTIME_BOT_TOKEN: 'token',
  TELEGRAM_UPTIME_BOT_SECRET: 'secret',
  STRIPE_EARLY_BIRD_PRICE_ID: 'test-early-bird-price-id',
  STRIPE_BUILDER_PRICE_ID: 'test-builder-price-id',
  STRIPE_PRO_PRICE_ID: 'test-pro-price-id',
  STRIPE_API_KEY_SECRET: 'test-api-key-secret',
  ADMIN_SUPER_SECRET_ADMIN_KEY: 'test',
};

for (const [name, value] of Object.entries(TEST_ENV_DEFAULTS)) {
  process.env[name] ??= value;
}
