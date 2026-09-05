import type { DocPage } from '$lib/landing/guides/documentation.data';

export const selfHostingIssueUrl =
  'https://github.com/logdash-io/logdash.io/issues/251';

/**
 * This page lists blockers instead of instructions on purpose. Anything that
 * reads like a how-to implies production self-hosting works today, and it does
 * not. The honest version costs us nothing and saves a reader an evening.
 */
export const selfHostingPage: DocPage = {
  path: '/docs/self-hosting',
  title: 'Self-host Logdash: status and how to run it locally',
  description:
    'Logdash is MIT licensed and the repository is public. Running it in production on your own infrastructure is not supported yet. Here is what works and what does not.',
  blocks: [
    {
      type: 'paragraph',
      text: 'The entire product lives in one public repository. There is no open-core split, no private mirror and no feature held back. You can read every line, fork it and run it on your own machine today.',
    },
    {
      type: 'paragraph',
      text: 'What you cannot do today is run it in production without work we have not done for you. This page names that work rather than pretending it is not there.',
    },
    { type: 'heading', text: 'What exists today' },
    {
      type: 'list',
      items: [
        'A backend image at apps/backend/Dockerfile, three stages on node 22.',
        'A status page image at apps/status-page/Dockerfile.',
        'MongoDB schema migrations through migrate-mongo, and ClickHouse migrations through clickhouse-migrations.',
        'A docker-compose.dev.yml that brings up Mongo, Redis and ClickHouse for development.',
      ],
    },
    { type: 'heading', text: 'What blocks production self-hosting' },
    {
      type: 'paragraph',
      text: 'None of these is hypothetical. Each one is a thing you would hit within the first hour.',
    },
    {
      type: 'list',
      items: [
        'Stripe and Resend throw inside their constructors when their keys are empty, and both are built at boot, so the backend process will not start without them.',
        'GitHub and Google OAuth are the only login methods. There is no email or password login, so a self-hosted instance cannot sign anyone in until you register your own OAuth apps.',
        'Around 40 environment variables, most of them cloud-only.',
        'No compose file that runs the applications. The one in the repository starts the datastores and nothing else.',
        'No published container images. You build them yourself.',
      ],
    },
    { type: 'heading', text: 'Run it locally today' },
    {
      type: 'paragraph',
      text: 'A development instance on your own machine does work, and it is the same set of commands contributors use. From a clean checkout:',
    },
    {
      type: 'code',
      language: 'bash',
      title: 'Running locally',
      code: `pnpm install
docker compose -f docker-compose.dev.yml up -d --wait
cp apps/backend/.env.example apps/backend/.env
pnpm --filter backend migrate-up
pnpm --filter backend migrate-clickhouse

# in two terminals
pnpm dev:backend
pnpm dev:frontend`,
    },
    {
      type: 'paragraph',
      text: 'Stripe and Resend accept placeholder keys, because their constructors only check that a key is present rather than that it works. Signing in is the part you have to supply yourself: put your own GitHub or Google OAuth credentials in apps/backend/.env, or nothing will let you through the door.',
    },
    { type: 'heading', text: 'FAQ' },
    {
      type: 'faq',
      items: [
        {
          question: 'Can I self-host Logdash today?',
          answer:
            'For development, yes. The commands above give you a working instance on your own machine. For production, no. Stripe and Resend keys are required for the process to boot at all, OAuth apps are required before anyone can log in, and there is no compose file or published image that runs the applications rather than the datastores.',
        },
        {
          question: 'Is Logdash actually open source?',
          answer:
            'Yes. MIT licensed, one public repository, no enterprise edition holding the interesting parts back. The hosted cloud is the paid product; the code is not the thing being sold.',
        },
        {
          question: 'What is the plan for self-hosting?',
          answer:
            'Make the cloud-only integrations optional instead of required, add a login path that does not depend on an OAuth app you have to register, cut the environment surface down, and publish images with a compose file that runs them. There is no date. Follow the issue below rather than trusting this paragraph.',
        },
      ],
    },
  ],
};
