import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const BUILD_DIRECTORY = '.svelte-kit/cloudflare';
const RELEASE_NAME = 'logdash-frontend';
const HOST = process.env.POSTHOG_CLI_HOST ?? 'https://eu.posthog.com';

function hasCredentials() {
  return Boolean(
    process.env.POSTHOG_CLI_API_KEY && process.env.POSTHOG_CLI_PROJECT_ID,
  );
}

if (!hasCredentials()) {
  console.info(
    'Skipping PostHog source map upload: POSTHOG_CLI_API_KEY and POSTHOG_CLI_PROJECT_ID are not set.',
  );
  process.exit(0);
}

if (!existsSync(BUILD_DIRECTORY)) {
  console.error(
    `PostHog source map upload failed: build directory "${BUILD_DIRECTORY}" was not found. Run the build before uploading.`,
  );
  process.exit(1);
}

const args = [
  '--host',
  HOST,
  'sourcemap',
  'process',
  '--directory',
  BUILD_DIRECTORY,
  '--release-name',
  RELEASE_NAME,
  '--delete-after',
];

if (process.env.POSTHOG_CLI_RELEASE_VERSION) {
  args.push('--release-version', process.env.POSTHOG_CLI_RELEASE_VERSION);
}

const result = spawnSync('posthog-cli', args, { stdio: 'inherit' });
if (result.error) {
  console.error(`Failed to run posthog-cli: ${result.error.message}`);
  process.exit(1);
}
process.exit(result.status ?? 1);
