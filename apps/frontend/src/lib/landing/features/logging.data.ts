import type { FeaturePageData } from './feature-page';

export const loggingPage: FeaturePageData = {
  slug: 'logging',
  name: 'Log management',
  meta: {
    title: 'Log management and live search for SaaS apps | Logdash',
    description:
      'Log management for SaaS apps. Send logs from Node.js, Python, Go and more with one line, then search and filter them live. Free for 10,000 logs an hour.',
    keywords:
      'log management, centralized logging, application logs, log monitoring, live tail logs, log search, node.js logging',
  },
  h1: 'Log management for SaaS apps.',
  h1Quiet: 'Every line, one search away.',
  intro:
    'Send logs from any language with one line of code. Search and filter them live, with every instance of your app in one stream.',
  overview: {
    title: 'A monitor tells you it’s down.',
    quiet: 'Your\u00a0logs tell you why.',
    description:
      'Logs spread across servers and terminals turn every bug into a hunt. Put them in one stream and the hunt becomes a search.',
  },
  capabilities: [
    {
      title: 'Every instance, one stream',
      body: 'Every server, worker and cron job that uses your API key writes to the same stream. No more hopping between machines.',
    },
    {
      title: 'Live tail',
      body: 'New lines show up the moment they arrive. Your search and filters stay on, so only the lines you care about scroll by.',
    },
    {
      title: 'Full-text search',
      body: 'Type a few words and get every line that contains all of them, ignoring case. Any id or email you logged is searchable.',
    },
    {
      title: 'Levels and namespaces',
      body: 'Seven log levels, from error down to silly. Split a service into auth, payments or cron with namespaces and filter by them.',
    },
    {
      title: 'Error volume chart',
      body: 'A chart above the list counts lines over time, with errors in red. Drag across a spike to zoom the list into those minutes.',
    },
    {
      title: 'The whole line',
      body: 'Open a line to read the whole message, with JSON pretty printed. Arrow keys step through the other lines at that level.',
    },
  ],
  steps: {
    title: 'Your first log in three steps.',
    description:
      'No agent to run and no config file. If you can write console.log, you can do this.',
    items: [
      {
        title: 'Copy the setup prompt',
        body: 'Open Logs in your project and pick your stack. The prompt Logdash copies holds your API key, the install command and a code sample.',
      },
      {
        title: 'Paste it, or wire it by hand',
        body: 'Hand the prompt to your AI coding assistant and it adds the SDK. Or run npm install @logdash/node and pass your key yourself.',
      },
      {
        title: 'Search the first lines',
        body: 'Logs land in the live stream a moment after you send them. Type a word, pick a level, and open a line to read it in full.',
      },
    ],
  },
  sdk: {
    title: 'Node.js logging in one line.',
    body: 'Import the SDK, pass your API key and call the level you need. Lines print to your console too, and the same package runs in Next.js, SvelteKit, Express and Bun.',
    language: 'typescript',
    file: 'server.ts',
    code: `import { Logdash } from '@logdash/node';

const logdash = new Logdash(process.env.LOGDASH_API_KEY);

logdash.info('Application started successfully');
logdash.error('An unexpected error occurred');
logdash.warn('Low disk space warning');

const authLogdash = logdash.withNamespace('auth');
authLogdash.info('User logged in');
authLogdash.error('Authentication failed');`,
  },
  faq: [
    {
      question: 'How long are logs kept?',
      answer:
        '24 hours on the free Hobby plan, 7 days on Builder and 30 days on Pro. Older lines drop out of search on their own.',
    },
    {
      question: 'Is there a free plan for logs?',
      answer:
        'Yes. Hobby is free and takes up to 10,000 logs per hour for each service, kept for 24 hours. Builder at $9 a month raises that to 25,000 an hour, and Pro at $15 to 50,000.',
    },
    {
      question: 'Which languages are supported?',
      answer:
        'Official SDKs cover Node.js, Python, Go, .NET, Java, Rust, Ruby and PHP. The Node.js package also runs in Next.js, SvelteKit, Express, NestJS, Fastify, Bun and Deno.',
    },
    {
      question: 'Can I send logs without an SDK?',
      answer:
        'Yes. POST JSON with message, level and createdAt to https://api.logdash.io/logs and put your key in the project-api-key header. /logs/batch takes up to 100 logs per request.',
    },
    {
      question: 'Can I search my logs?',
      answer:
        'Yes. Type one or more words and you get every line whose message contains all of them, ignoring case. Level and namespace filters stack on top and keep working as new lines stream in, and a time range takes you further back.',
    },
    {
      question: 'Which log levels are supported?',
      answer:
        'Seven: error, warning, info, http, verbose, debug and silly. The Node.js SDK has a method for each, like logdash.error() and logdash.warn().',
    },
    {
      question: 'Does logging slow down my app?',
      answer:
        'Log calls in the Node.js SDK return right away. Lines are queued and sent in small batches in the background. In short-lived jobs, await logdash.flush() before the process exits.',
    },
    {
      question: 'Can I get alerts on error logs?',
      answer:
        'Not from log lines. Alerts fire when an uptime check fails, on Telegram or a webhook. In the log view, errors are drawn in red on the volume chart, so a spike stands out.',
    },
  ],
  related: [
    {
      title: 'Logging docs',
      description: 'Retention and hourly log limits for every plan.',
      href: '/docs/logging',
    },
    {
      title: 'Pricing',
      description: 'Hobby is free. Builder and Pro keep logs longer.',
      href: '/pricing',
    },
    {
      title: 'Logdash vs Datadog',
      description: 'Logs, metrics and uptime without the enterprise bill.',
      href: '/vs/datadog',
    },
  ],
};
