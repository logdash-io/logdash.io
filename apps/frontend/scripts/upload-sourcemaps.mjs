import { spawnSync } from 'node:child_process';

if (!process.env.POSTHOG_CLI_API_KEY || !process.env.POSTHOG_CLI_PROJECT_ID) {
  console.info(
    'Skipping the PostHog source map upload: POSTHOG_CLI_API_KEY and POSTHOG_CLI_PROJECT_ID are not set.',
  );
  process.exit(0);
}

const { status } = spawnSync(
  'posthog-cli',
  [
    '--host',
    process.env.POSTHOG_CLI_HOST ?? 'https://eu.posthog.com',
    'sourcemap',
    'process',
    '--directory',
    '.svelte-kit/cloudflare',
    '--release-name',
    'logdash-frontend',
    '--delete-after',
  ],
  { stdio: 'inherit' },
);

process.exit(status ?? 1);
