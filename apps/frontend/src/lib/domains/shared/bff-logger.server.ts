import { building } from '$app/environment';
import { env } from '$env/dynamic/private';
import { Logdash } from '@logdash/node';

let logger: Logdash | undefined;

export function assertLogdashApiKey(): void {
  if (!building && !env.LOGDASH_API_KEY) {
    throw new Error(
      'LOGDASH_API_KEY is not set. The frontend server sends its logs and metrics to Logdash with this server-only ingest key.',
    );
  }
}

export function bffLogger(): Logdash {
  logger ??= new Logdash(
    building ? undefined : env.LOGDASH_API_KEY,
  ).withNamespace('frontend');

  return logger;
}

export async function flushBffLogger(): Promise<void> {
  await logger?.flush();
}
