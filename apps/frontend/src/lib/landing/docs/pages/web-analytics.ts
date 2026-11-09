import type { DocPage } from '$lib/landing/guides/documentation.data';

export const page: DocPage = {
  path: '/docs/web-analytics',
  title: 'Add the web analytics tracker',
  metaTitle: 'Web analytics | Logdash Docs',
  description:
    'Count visitors without cookies, track custom events with properties and see which signed-in users come back, with one script tag.',
  keywords:
    'cookieless analytics, website analytics script, privacy friendly analytics, logdash web analytics',
  blocks: [
    {
      type: 'paragraph',
      text: 'The Logdash tracker counts visitors, pageviews and sessions, where visitors come from and what they browse with, without cookies. Track the actions that matter as custom events, break them down by properties, and identify signed-in users to see who comes back.',
    },
    { type: 'heading', text: 'Add the script' },
    {
      type: 'steps',
      items: [
        {
          title: 'Start tracking',
          text: 'In Logdash, open your domain, go to **Analytics**, enter your website address and press **Start tracking**.',
        },
        {
          title: 'Paste the snippet',
          text: 'Paste the snippet it shows into the `<head>` of every page. The site ID in it is public and safe to ship in your HTML.',
          code: {
            language: 'html',
            title: 'index.html',
            code: `<script
  defer
  src="https://logdash.io/sdk/web.js"
  data-site="your-site-id"
  data-endpoint="https://api.logdash.io/web_events"
></script>`,
          },
        },
        {
          title: 'Open your site',
          text: 'Load any page of your site, then go back to **Analytics** in Logdash. The dashboard opens on today, live, so your visit is there.',
        },
      ],
    },
    {
      type: 'callout',
      text: 'Ad blockers often block analytics served from another domain. To count those visitors too, [serve the tracker from your own domain](/docs/web-analytics/proxy).',
    },
    { type: 'heading', text: 'What the tracker sends' },
    {
      type: 'table',
      headers: ['Event', 'When'],
      rows: [
        [
          '`pageview`',
          'On load, and whenever the path changes through `pushState`, `replaceState`, back and forward, or a page restored from the back-forward cache. Single-page apps need no extra code.',
        ],
        [
          '`pageleave`',
          'When the visitor leaves the page, for session time and exit pages.',
        ],
        [
          '`browser_error`',
          'For uncaught errors and unhandled promise rejections, without the error message or stack trace.',
        ],
        [
          'Custom events',
          'When you call `track`, described in [Custom events](/docs/web-analytics/custom-events).',
        ],
      ],
    },
    {
      type: 'paragraph',
      text: 'Events are sent in small batches about a second after they happen, and right away when the page is hidden.',
    },
    { type: 'heading', text: 'The JavaScript API' },
    {
      type: 'paragraph',
      text: 'The tracker exposes its API as `window.logdash`. Call it with `?.`, because the object does not exist before the deferred script has loaded or in browsers where the tracker does not start.',
    },
    {
      type: 'table',
      headers: ['Method', 'What it does'],
      rows: [
        [
          '`track(name, properties?)`',
          'Sends a [custom event](/docs/web-analytics/custom-events).',
        ],
        [
          '`identify(id)`',
          'Links later events to a [signed-in user](/docs/web-analytics/identify). `identify(null)` clears it.',
        ],
        [
          '`optOut()`',
          'Stops tracking in this browser until `optIn()`. See [Opt-out](/docs/web-analytics/opt-out).',
        ],
        ['`optIn()`', 'Starts tracking again after `optOut()`.'],
      ],
    },
    {
      type: 'code',
      language: 'javascript',
      code: `window.logdash?.track('signup_completed', { plan: 'pro' });`,
    },
    { type: 'heading', text: 'Script attributes' },
    {
      type: 'table',
      headers: ['Attribute', 'Description'],
      rows: [
        ['`data-site`', 'Your site ID, from the snippet in Logdash. Required.'],
        [
          '`data-endpoint`',
          'Where events go: `https://api.logdash.io/web_events`, or `/_ld/events` behind [your own proxy](/docs/web-analytics/proxy).',
        ],
        [
          '`data-respect-dnt`',
          'Keeps the tracker from starting in browsers that send Do Not Track or Global Privacy Control.',
        ],
      ],
    },
    { type: 'heading', text: 'Plan limits' },
    {
      type: 'paragraph',
      text: 'Your plan sets how long events are kept, counted from the time of each event, and how many events each domain takes per hour. Past that, the events endpoint answers `429` until the next full hour in UTC.',
    },
    { type: 'plan-limits', key: 'webAnalytics' },
    { type: 'heading', text: 'Privacy' },
    {
      type: 'paragraph',
      text: 'The tracker sets no cookies, IP addresses are never stored, and anonymous visitors are counted with an ID that changes every day. [Web analytics and privacy](/docs/web-analytics-privacy) describes what Logdash stores and for how long, and gives you text for your privacy policy.',
    },
  ],
};
