import type { DocPage } from '$lib/landing/guides/documentation.data';

export const page: DocPage = {
  path: '/docs/concepts',
  title: 'Core concepts',
  metaTitle: 'Core concepts | Logdash Docs',
  description:
    'Domains, apps, the ingest key, personal API keys and plans: the few ideas every other page of the Logdash docs builds on.',
  keywords:
    'logdash domain, logdash app, logdash ingest key, logdash api key, logdash concepts',
  blocks: [
    {
      type: 'paragraph',
      text: 'Logdash has a small model. You add a **domain**, the **apps** of that domain send logs and metrics with one **ingest key**, and you read your data with your account or a **personal API key**. This page explains each of them once, so the other pages can be short.',
    },
    { type: 'heading', text: 'Domains' },
    {
      type: 'paragraph',
      text: 'A domain is one product, such as `example.com`. Everything you set up in Logdash belongs to a domain: its uptime monitors and alert channels, its status pages, the apps that send logs and metrics, its web analytics and its team.',
    },
    {
      type: 'paragraph',
      text: 'When you add a domain, Logdash starts an uptime monitor for its address right away. Open a domain to find its sections: **Analytics**, **Uptime**, **Logs**, **Metrics**, **Status pages** and **Settings**.',
    },
    {
      type: 'callout',
      text: 'Add one domain per product, not per server. An API on `api.example.com` and a dashboard on `app.example.com` are two apps and two monitors of the same domain, and they share one team, one key and one analytics dashboard.',
    },
    { type: 'heading', text: 'Apps' },
    {
      type: 'paragraph',
      text: 'An app is one program that sends logs and metrics, such as an API, a background worker or a desktop app. Each app names itself with the `app` option of the SDK, or the `app` field of the [HTTP API](/docs/api). Logdash adds an app when its first log or metric arrives, so there is nothing to create first.',
    },
    {
      type: 'code',
      language: 'typescript',
      title: 'api/logger.ts',
      code: `import { Logdash } from '@logdash/node';

export const logdash = new Logdash(process.env.LOGDASH_API_KEY, { app: 'api' });`,
    },
    {
      type: 'list',
      items: [
        'Logs and metrics without an app name go to the app `default`.',
        'Names are trimmed and cut to 64 characters. Pick short, stable names, such as `api`, `worker` or `desktop`.',
        'Once a domain has more than one app, **Logs** gets an **App** filter and **Metrics** shows the app of each metric.',
        'The **Apps** card in **Settings** lists every app and what it sent. Deleting an app deletes its logs and metrics.',
      ],
    },
    { type: 'heading', text: 'Keys and IDs' },
    {
      type: 'paragraph',
      text: 'Logdash uses two secrets and a few public IDs. Only the two keys are secret: the IDs end up in your HTML, your README or your cron job, and that is fine.',
    },
    {
      type: 'table',
      headers: ['Name', 'Looks like', 'What it does', 'Where you find it'],
      rows: [
        [
          'Ingest key',
          '`ldi_…`',
          'Sends logs, metrics and app events to one domain. It can only write.',
          '**Settings**, **Ingest key** card',
        ],
        [
          'Personal API key',
          '`ldp_…`',
          'Reads your data and acts as you, limited to the access and domains you pick.',
          'Account menu, **API keys**',
        ],
        [
          'Site ID',
          'The `data-site` value',
          'Ties the events of the web analytics tracker to your domain.',
          '**Analytics**, in the script snippet',
        ],
        [
          'Monitor ID',
          'The end of the heartbeat URL',
          'Receives the pings of a [heartbeat monitor](/docs/monitoring/heartbeats).',
          'The monitor page, **Heartbeat endpoint**',
        ],
        [
          'Status page ID',
          'The end of `logdash.io/d/<id>`',
          'Reads a published status page and its badges.',
          'The status page address',
        ],
      ],
    },
    { type: 'heading', text: 'Ingest key', level: 3 },
    {
      type: 'paragraph',
      text: 'Each domain has one ingest key, shared by all of its apps. Send it in the `project-api-key` header, or pass it to the SDK, which does that for you. Keep it on your servers in an environment variable such as `LOGDASH_API_KEY`. Because it cannot read anything, a leaked key cannot expose your data.',
    },
    {
      type: 'callout',
      text: 'Older domains can have one key per app, from before apps shared a key. These keys keep working and always write to their own app, so they ignore the `app` option.',
    },
    { type: 'heading', text: 'Personal API key', level: 3 },
    {
      type: 'paragraph',
      text: 'A personal API key acts as you, for scripts, the [read API](/docs/api#read-your-data) and coding agents that cannot sign in through the browser. You choose what it can do, which domains it reaches and when it expires. Send it as `Authorization: Bearer ldp_…`. See [Personal API keys](/docs/api-keys).',
    },
    { type: 'heading', text: 'Teams' },
    {
      type: 'paragraph',
      text: 'Each domain has its own team. The person who added the domain is its **Owner**, and they can invite **Admins** and **Members**. See [Team members](/docs/team) for what each role can do.',
    },
    { type: 'heading', text: 'Plans' },
    {
      type: 'paragraph',
      text: 'Your plan belongs to your account and applies to every domain you added. Team members work under the plan of the domain owner, not their own. Some limits count across all your domains, such as the number of monitors and apps, and others apply per domain or per app. [Plans and limits](/docs/limits) lists every limit.',
    },
  ],
};
