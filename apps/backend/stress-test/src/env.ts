/**
 * Configuration for the stress-test scripts.
 *
 * Never hardcode a project API key here. These scripts talk to real ingest endpoints,
 * this repository is public, and anything committed is a live credential the moment it
 * lands on `main`. Read it from the environment instead - see `.env.example`.
 */

export function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. ` +
        `Copy .env.example to .env and fill it in, or export ${name} before running.`,
    );
  }

  return value;
}

/** Project API key used to ingest logs/metrics. */
export function requireApiKey(): string {
  return requireEnv('LOGDASH_API_KEY');
}

/** Secondary project API key, for scripts that need to write to two projects. */
export function requireSecondaryApiKey(): string {
  return requireEnv('LOGDASH_API_KEY_SECONDARY');
}

/** Base URL of the API to hit. Defaults to production. */
export function apiHost(): string {
  return process.env.LOGDASH_API_HOST ?? 'https://api.logdash.io';
}
