import type { DocPage } from '$lib/landing/guides/documentation.data';

export const page: DocPage = {
  path: '/docs/web-analytics/proxy',
  title: 'Serve the tracker from your own domain',
  metaTitle: 'First-party analytics proxy | Logdash Docs',
  description:
    'Ad blockers often block analytics served from another domain. Two routes on your own domain forward the tracker and its events to Logdash.',
  keywords:
    'first-party analytics proxy, analytics ad blocker, proxy analytics script, logdash proxy',
  blocks: [
    {
      type: 'paragraph',
      text: 'Ad blockers often block analytics served from another domain. Serve the script and the events from your own domain instead, with two routes that forward to Logdash. The tracker works the same either way.',
    },
    {
      type: 'callout',
      text: 'Prefer not to write the routes yourself? The **AI prompt** tab of the setup in Logdash gives your coding agent a prompt that adds both routes and the script tag to your codebase, and checks them end to end.',
    },
    { type: 'heading', text: 'Add two routes' },
    {
      type: 'table',
      headers: ['Route', 'Forwards to', 'Notes'],
      rows: [
        [
          '`GET /_ld/script.js`',
          '`https://logdash.io/sdk/web.js`',
          'Serve it as `application/javascript` and cache successful responses.',
        ],
        [
          '`POST /_ld/events`',
          '`https://api.logdash.io/web_events`',
          'Pass the status code back. Accept JSON bodies of up to 32 KB, and do not cache the responses.',
        ],
      ],
    },
    { type: 'heading', text: 'Forward the right headers' },
    {
      type: 'paragraph',
      text: "On the events route, forward the browser's `Origin` and `User-Agent` headers, and set `x-logdash-client-ip` to the visitor's IP address.",
    },
    {
      type: 'list',
      items: [
        'Without an `Origin` the API answers 403.',
        "Without the IP address every visitor shares your server's address, so visitors are undercounted. If that server runs in a datacenter or cloud, every event is dropped.",
      ],
    },
    {
      type: 'callout',
      tone: 'warning',
      text: 'Never forward cookies, authorization headers or ingest keys on either route, and keep the target URLs fixed so the routes cannot become an open proxy.',
    },
    { type: 'heading', text: 'Point the script tag at your routes' },
    {
      type: 'code',
      language: 'html',
      title: 'index.html',
      code: `<script
  defer
  src="/_ld/script.js"
  data-site="your-site-id"
  data-endpoint="/_ld/events"
></script>`,
    },
    {
      type: 'paragraph',
      text: "Load a page and open your browser's network panel: the script comes from `/_ld/script.js` and events go to `/_ld/events` with status 202.",
    },
  ],
};
