import type { DocPage } from '$lib/landing/guides/documentation.data';

export const page: DocPage = {
  path: '/docs/web-analytics/app-events',
  title: 'Events from your apps',
  description:
    'Send events from your servers, desktop apps and CLIs to the same dashboard as your website, and see one user across all of them.',
  keywords:
    'server side analytics events, product analytics api, desktop app analytics, cli analytics',
  blocks: [
    {
      type: 'paragraph',
      text: "Your apps, servers and desktop clients send events to the same dashboard with your domain's ingest key, which you copy from the domain's settings. App events follow the same rules for names and properties as [custom events](/docs/web-analytics/custom-events) on the website, and show up in the **Goals** card next to them.",
    },
    { type: 'heading', text: 'Send an event' },
    {
      type: 'paragraph',
      text: 'Name the app with `app`, the same name the SDK sends with logs and metrics.',
    },
    {
      type: 'code',
      language: 'bash',
      title: 'Terminal',
      code: `curl -X POST https://api.logdash.io/events \\
  -H "project-api-key: $LOGDASH_API_KEY" \\
  -H "content-type: application/json" \\
  -d '{"name": "agent_run", "app": "desktop", "props": {"model": "opus"}, "userId": "42"}'`,
    },
    { type: 'heading', text: 'Request body' },
    {
      type: 'table',
      headers: ['Field', 'Description'],
      rows: [
        ['`name`', 'The event name. Matches `[a-z][a-z0-9_]{0,63}`. Required.'],
        [
          '`app`',
          'The app that sent it, such as `desktop` or `api`. Defaults to `default`, and longer names are cut to 64 characters.',
        ],
        [
          '`props`',
          'A flat object of properties, with the same limits as [custom events](/docs/web-analytics/custom-events#properties).',
        ],
        [
          '`userId`',
          "The signed-in user's internal ID, never an email address. Logdash stores only the same hash `identify` sends from the website, so one user is one person across your website and every app.",
        ],
        [
          '`id`',
          'An optional UUID v4. Send the same one when you retry a request, so the event is stored once.',
        ],
      ],
    },
    {
      type: 'callout',
      tone: 'warning',
      text: 'Without `userId`, the event counts toward a visitor of that app whose ID changes every day, like an anonymous website visitor. From a server, always pass `userId`: otherwise every event from that server counts as one visitor.',
    },
    { type: 'heading', text: 'Responses' },
    {
      type: 'table',
      headers: ['Status', 'Meaning'],
      rows: [
        ['`202`', 'The event is queued.'],
        ['`400`', 'The event is invalid.'],
        ['`401`', 'The ingest key is unknown.'],
        ['`429`', 'The hourly limit of your plan is reached.'],
      ],
    },
    { type: 'heading', text: 'The Apps tab' },
    {
      type: 'paragraph',
      text: 'Once more than one app sends events, the **Goals** card gets an **Apps** tab with the visits and people of each app, the website by its host name. Clicking an app keeps the visitors who used it, so the **Apps** tab then shows how many of them also use your other apps.',
    },
    {
      type: 'paragraph',
      text: 'People who are signed in on both sides are the only ones Logdash can connect, because anonymous IDs are never shared between apps.',
    },
  ],
};
