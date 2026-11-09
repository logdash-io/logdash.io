import CurlIcon from '$lib/domains/shared/icons/CurlIcon.svelte';
import type { DocPage } from '$lib/landing/guides/documentation.data';
import { sdkTabs } from '../sdk-docs.data';

export const page: DocPage = {
  path: '/docs/logging',
  title: 'Logging',
  metaTitle: 'Logging | Logdash Docs',
  description:
    'Send logs from every app with one key, then search, filter and follow them live, with levels, namespaces and apps.',
  keywords:
    'logging, log management, application logs, live log tail, log search, logdash logs',
  blocks: [
    {
      type: 'paragraph',
      text: 'Send logs from your code with an SDK or one HTTP request, and they show up in **Logs** within a second. Every app of a domain sends with the same ingest key, and you search them all in one place.',
    },
    { type: 'heading', text: 'Send logs' },
    {
      type: 'paragraph',
      text: 'Copy the ingest key from **Settings**, keep it in `LOGDASH_API_KEY` and pass it to the SDK. Without a key, the SDKs write to the console only, which is handy in local development.',
    },
    {
      type: 'code-group',
      items: [
        ...sdkTabs((doc) => doc.log),
        {
          title: 'curl',
          icon: CurlIcon,
          language: 'bash',
          code: `curl -X POST https://api.logdash.io/logs \\
  -H "project-api-key: $LOGDASH_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Application started successfully", "level": "info", "createdAt": "'"$(date -u +%FT%TZ)"'"}'`,
        },
      ],
    },
    {
      type: 'callout',
      text: 'Most SDKs send logs in the background. In a short-lived process, such as a cron job or a serverless function, flush before the process exits so the last logs are sent. The page of [your SDK](/docs/sdks) shows how.',
    },
    { type: 'heading', text: 'Levels' },
    {
      type: 'paragraph',
      text: 'Every log has one of seven levels. The SDKs have a method for each, and the HTTP API takes the name in `level`.',
    },
    {
      type: 'table',
      headers: ['Level', 'Use it for'],
      rows: [
        ['`error`', 'Something failed and needs attention.'],
        [
          '`warning`',
          'Something looks wrong but still works. The SDK methods are called `warn`.',
        ],
        [
          '`info`',
          'What your app does, such as a started job or a new signup.',
        ],
        ['`http`', 'Requests your app serves or makes.'],
        ['`verbose`', 'More detail than `info`.'],
        ['`debug`', 'Detail for debugging.'],
        ['`silly`', 'Everything else.'],
      ],
    },
    { type: 'heading', text: 'Namespaces' },
    {
      type: 'paragraph',
      text: 'A namespace groups the logs of one part of your app, such as `auth` or `billing`, so you can filter by it. In the Node.js SDK, `withNamespace` returns a logger that adds the namespace to every log. Over HTTP, send it in `namespace`, up to 255 characters.',
    },
    {
      type: 'code',
      language: 'typescript',
      title: 'auth.ts',
      code: `const authLogdash = logdash.withNamespace('auth');

authLogdash.info('User logged in');
authLogdash.error('Authentication failed');`,
    },
    { type: 'heading', text: 'Apps' },
    {
      type: 'paragraph',
      text: 'When more than one program sends logs, name each with the `app` option, such as `api` or `worker`. Logdash adds the app with its first log, and **Logs** gets an **App** filter. See [Apps](/docs/concepts#apps).',
    },
    {
      type: 'code',
      language: 'typescript',
      title: 'worker.ts',
      code: `const logdash = new Logdash(process.env.LOGDASH_API_KEY, { app: 'worker' });`,
    },
    { type: 'heading', text: 'Search and filter' },
    {
      type: 'paragraph',
      text: 'The **Logs** page shows the newest logs first, with a chart of log volume above them.',
    },
    {
      type: 'list',
      items: [
        '**Search logs** finds logs that contain every word you type, in any case.',
        '**Errors** and **Warnings** show only logs of that level, in one click.',
        'The filters narrow by **App**, **Level**, **Namespace** and **Time range**. Hold ⌘ or Shift to pick more than one value.',
        '**Time range** offers the last 15 minutes up to the last 30 days, or a **Custom range**. Ranges longer than the retention of your plan show **Upgrade**.',
        'Drag across the volume chart to zoom into that time.',
        'The clock button switches between relative and exact times.',
      ],
    },
    { type: 'heading', text: 'Read a log', level: 3 },
    {
      type: 'paragraph',
      text: 'Click a log to open it with its full message, level, namespace and app. The arrow keys move to the previous or next log of the same level, so you can step through every error in a row. Press Esc to close it.',
    },
    { type: 'heading', text: 'Live tail', level: 3 },
    {
      type: 'paragraph',
      text: 'Without a time range, new logs appear as they arrive and match your search and filters. Picking a time range stops following, and clearing it starts again. The page also pauses while its tab is hidden.',
    },
    { type: 'heading', text: 'Limits' },
    {
      type: 'list',
      items: [
        'Messages longer than 4,096 characters are cut.',
        'Each app can send a fixed number of logs per hour. The hour starts with the first log, and logs past the limit get `429 Rate limit exceeded` until it ends.',
        'Logs are deleted when they are older than the retention of your plan.',
      ],
    },
    { type: 'plan-limits', key: 'logs' },
    {
      type: 'paragraph',
      text: 'For every field, the batch endpoint and the read API, see [HTTP API](/docs/api#logs).',
    },
  ],
};
