export interface Guide {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: 'migration' | 'setup' | 'integration';
}

export const guides: Guide[] = [
  {
    id: 'sdk-migration',
    slug: 'sdk-migration',
    title: 'Migrating from @logdash/js-sdk to @logdash/node',
    description:
      'Learn how to migrate your codebase from the legacy JS SDK to the new unified Node.js package.',
    icon: 'migration',
  },
];

export interface MigrationChange {
  aspect: string;
  oldSdk: string;
  newSdk: string;
}

export const migrationChanges: MigrationChange[] = [
  {
    aspect: 'Package',
    oldSdk: '@logdash/js-sdk',
    newSdk: '@logdash/node',
  },
  {
    aspect: 'Import',
    oldSdk: "import { createLogDash } from '@logdash/js-sdk'",
    newSdk: "import { Logdash } from '@logdash/node'",
  },
  {
    aspect: 'Initialization',
    oldSdk: "const { logger, metrics } = createLogDash({ apiKey: '...' })",
    newSdk: "const logdash = new Logdash('...')",
  },
  {
    aspect: 'Logging',
    oldSdk: 'logger.info() / logger.error() / logger.warn()',
    newSdk: 'logdash.info() / logdash.error() / logdash.warn()',
  },
  {
    aspect: 'Set Metric',
    oldSdk: "metrics.set('users', 0)",
    newSdk: "logdash.setMetric('users', 0)",
  },
  {
    aspect: 'Mutate Metric',
    oldSdk: "metrics.mutate('users', 1)",
    newSdk: "logdash.mutateMetric('users', 1)",
  },
];

export const newFeatures = [
  {
    title: 'Namespaced Logging',
    description:
      'Create scoped loggers for different parts of your application.',
    example: `const authLogdash = logdash.withNamespace('auth');
authLogdash.info('User logged in');`,
  },
  {
    title: 'Graceful Shutdown',
    description:
      'Ensure all logs and metrics are sent before your application exits.',
    example: 'await logdash.flush();',
  },
];

export const migrationPrompt = `Migrate my codebase from @logdash/js-sdk to @logdash/node. Apply these changes:

1. Replace package: Change \`@logdash/js-sdk\` to \`@logdash/node\`
2. Replace import: Change \`import { createLogDash } from '@logdash/js-sdk'\` to \`import { Logdash } from '@logdash/node'\`
3. Replace initialization: Change \`const { logger, metrics } = createLogDash({ apiKey: '...' })\` to \`const logdash = new Logdash('...')\`
4. Replace logger calls: Change \`logger.info/error/warn/debug()\` to \`logdash.info/error/warn/debug()\`
5. Replace metrics calls: Change \`metrics.set()\` to \`logdash.setMetric()\` and \`metrics.mutate()\` to \`logdash.mutateMetric()\`
6. On program exit, call \`logdash.flush()\` to ensure all logs and metrics are sent.

Keep the same API key values. The new SDK uses a class-based API where logging and metrics are methods on the same Logdash instance.`;
