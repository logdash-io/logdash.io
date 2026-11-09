import type { DocPage } from '$lib/landing/guides/documentation.data';

export const page: DocPage = {
  path: '/docs/status-pages/api',
  metaTitle: 'Build your own status page | Logdash Docs',
  keywords:
    'status page api, headless status page, custom status page, status page react, status page svelte, nextjs status page',
  title: 'Build your own status page',
  description:
    'A public API, a typed client and copy-paste components for a status page that looks like the rest of your site.',
  blocks: [
    {
      type: 'paragraph',
      text: 'Every status page you publish in Logdash is also available as JSON from a public API. Use it to build a status page on your own domain with your own fonts and colours, or to show live status inside your app.',
    },
    {
      type: 'paragraph',
      text: 'Pick the level that suits you. The Next.js starter is a complete page you can deploy in a few minutes. The component puts the same page into an app you already have. The client library gives you typed data with live updates for your own UI, and the API works from anything that can make an HTTP request.',
    },
    { type: 'heading', text: 'Find your status page id' },
    {
      type: 'paragraph',
      text: 'Every request names a status page by its id. Open the status page in Logdash and copy the id from the Build your own section, or take it from the public URL of the page, `https://logdash.io/d/<id>`. A verified custom domain, such as `status.example.com`, works as an id too.',
    },
    {
      type: 'paragraph',
      text: 'The status page has to be published. A draft answers with 403.',
    },
    { type: 'heading', text: 'Deploy the Next.js starter' },
    {
      type: 'paragraph',
      text: 'The starter is a small Next.js app with one page and one component, styled with Tailwind and the shadcn/ui CSS variables. Deploy it to Vercel with the button in its README and set `LOGDASH_STATUS_PAGE_ID`, or create a copy and run it anywhere Next.js runs.',
    },
    {
      type: 'code',
      language: 'bash',
      code: `npx create-next-app@latest status-page \\
--example https://github.com/logdash-io/logdash.io \\
--example-path templates/status-page-next
cd status-page
cp .env.example .env.local

# set LOGDASH_STATUS_PAGE_ID in .env.local, then
npm run dev`,
    },
    {
      type: 'paragraph',
      text: 'The server fetches the status page and Next.js renders it again at most once a minute, so the page arrives complete in the HTML. In the browser, the component keeps it fresh. When the Logdash API cannot be reached, the page keeps showing the last data it had.',
    },
    {
      type: 'paragraph',
      text: 'Host it apart from your app. People open a status page when your app is down, and a page that shares its servers, deploys or DNS setup with your app goes down with it.',
    },
    { type: 'heading', text: 'Add the component' },
    {
      type: 'paragraph',
      text: 'The component is one file that becomes part of your code: an overall status banner, a row per monitor with its uptime, and 90 days of history bars with a tooltip. It is styled with Tailwind and the shadcn/ui CSS variables, such as `text-foreground`, `text-muted-foreground` and `border-border`, so it takes on your theme. Its only dependency is `@logdash/status`.',
    },
    {
      type: 'code',
      language: 'bash',
      title: 'React',
      code: 'npx shadcn add https://logdash.io/r/react/status-page.json',
    },
    {
      type: 'code',
      language: 'bash',
      title: 'Svelte',
      code: 'npx shadcn-svelte add https://logdash.io/r/svelte/status-page.json',
    },
    {
      type: 'paragraph',
      text: 'Render it with your status page id. It also takes `initialData` for server rendering, `pollInterval` in milliseconds and `baseUrl`.',
    },
    {
      type: 'code',
      language: 'typescript',
      title: 'React',
      code: `import { StatusPage } from '@/components/status-page';

export default function Page() {
return <StatusPage statusPageId="your-status-page-id" />;
}`,
    },
    {
      type: 'code',
      language: 'svelte',
      title: 'Svelte',
      code: `<script lang="ts">
import StatusPage from '$lib/components/StatusPage.svelte';
</script>

<StatusPage statusPageId="your-status-page-id" />`,
    },
    { type: 'heading', text: 'Use the client library' },
    {
      type: 'paragraph',
      text: '`@logdash/status` is a typed client with no dependencies. It runs in the browser and on the server, and comes with bindings for React 18 and later and Svelte 5.7 and later.',
    },
    { type: 'code', language: 'bash', code: 'npm i @logdash/status' },
    {
      type: 'paragraph',
      text: '`fetchStatusPage` makes one request and returns the typed response.',
    },
    {
      type: 'code',
      language: 'typescript',
      code: `import { fetchStatusPage } from '@logdash/status';

const page = await fetchStatusPage('your-status-page-id');

console.log(page.status);`,
    },
    {
      type: 'paragraph',
      text: 'In React, `useStatusPage` returns `data`, `error`, `isLoading` and `lastUpdated`, and keeps them fresh.',
    },
    {
      type: 'code',
      language: 'typescript',
      title: 'React',
      code: `'use client';

import { useStatusPage } from '@logdash/status/react';

export function Status() {
const { data } = useStatusPage('your-status-page-id');

if (!data) return null;

return (
  <ul>
    {data.monitors.map((monitor) => (
      <li key={monitor.id}>
        {monitor.name}: {monitor.status}
      </li>
    ))}
  </ul>
);
}`,
    },
    {
      type: 'paragraph',
      text: 'In Svelte, `statusPage` returns an object with the same fields, and reading them in markup keeps them fresh. Wrap the call in `$derived` when the id can change.',
    },
    {
      type: 'code',
      language: 'svelte',
      title: 'Svelte',
      code: `<script lang="ts">
import { statusPage } from '@logdash/status/svelte';

const page = statusPage('your-status-page-id');
</script>

{#if page.data}
<ul>
  {#each page.data.monitors as monitor (monitor.id)}
    <li>{monitor.name}: {monitor.status}</li>
  {/each}
</ul>
{/if}`,
    },
    { type: 'heading', text: 'Server rendering' },
    {
      type: 'paragraph',
      text: 'Fetch on the server and pass the result as `initialData`. The page arrives complete in the HTML with no loading state, the server and the browser render the same markup, and polling carries on from there.',
    },
    {
      type: 'code',
      language: 'typescript',
      title: 'Next.js: app/page.tsx',
      code: `import { fetchStatusPage } from '@logdash/status';
import { Status } from './status';

export const revalidate = 60;

export default async function Page() {
const page = await fetchStatusPage('your-status-page-id');

return <Status initialData={page} />;
}`,
    },
    {
      type: 'code',
      language: 'typescript',
      title: 'Next.js: app/status.tsx',
      code: `'use client';

import type { StatusPage } from '@logdash/status';
import { useStatusPage } from '@logdash/status/react';

export function Status({ initialData }: { initialData: StatusPage }) {
const { data } = useStatusPage('your-status-page-id', { initialData });

return <h1>{data?.name}</h1>;
}`,
    },
    {
      type: 'code',
      language: 'typescript',
      title: 'SvelteKit: +page.server.ts',
      code: `import { fetchStatusPage } from '@logdash/status';

export async function load() {
return { page: await fetchStatusPage('your-status-page-id') };
}`,
    },
    {
      type: 'code',
      language: 'svelte',
      title: 'SvelteKit: +page.svelte',
      code: `<script lang="ts">
import { statusPage } from '@logdash/status/svelte';

let { data } = $props();

const page = $derived(
  statusPage('your-status-page-id', { initialData: data.page }),
);
</script>

<h1>{page.data?.name}</h1>`,
    },
    { type: 'heading', text: 'Polling' },
    {
      type: 'list',
      items: [
        'Polling runs only in the browser, every 60 seconds by default. Set `pollInterval` to change it.',
        'It starts when a component first reads the data and stops when nothing reads it any more.',
        'It pauses while the tab is hidden and fetches again as soon as the tab is visible.',
        'A failed request keeps the last good data and sets `error`, so a network blip does not blank the page.',
        '`lastUpdated` is when the server composed the data, from `updatedAt`, not when the browser received it.',
        'Polling faster than once a minute brings nothing new, because every response is cached for 60 seconds.',
      ],
    },
    { type: 'heading', text: 'API reference' },
    {
      type: 'paragraph',
      text: 'One public endpoint, no API key. Pass the status page id or its verified custom domain.',
    },
    {
      type: 'code',
      language: 'bash',
      code: 'curl https://api.logdash.io/v1/status_pages/your-status-page-id',
    },
    {
      type: 'paragraph',
      text: 'The response looks like this, shortened: `history.daily` always has 90 entries and `pings` up to 100.',
    },
    {
      type: 'code',
      language: 'json',
      code: `{
"name": "Acme",
"status": "operational",
"updatedAt": "2026-09-28T12:00:00.000Z",
"monitors": [
  {
    "id": "Xq3vN8kP2mLw",
    "name": "API",
    "status": "up",
    "uptime": {
      "1h": 100,
      "24h": 100,
      "7d": 99.98,
      "30d": 99.95,
      "90d": 99.97
    },
    "history": {
      "daily": [
        {
          "timestamp": "2026-09-28T00:00:00.000Z",
          "successCount": 720,
          "failureCount": 0,
          "averageLatencyMs": 182
        }
      ]
    },
    "pings": [
      {
        "createdAt": "2026-09-28T11:59:00.000Z",
        "statusCode": 200,
        "responseTimeMs": 175
      }
    ]
  }
]
}`,
    },
    {
      type: 'list',
      items: [
        '`name` is the status page name set in Logdash.',
        '`status` is the overall status: `operational`, `degraded`, `outage` or `unknown`.',
        '`updatedAt` is when the server composed the response.',
        '`monitors` lists the monitors on the page, in the order they are configured.',
        '`monitors[].id` is a stable public id for the monitor, the same key its README badge uses. It makes a good list key.',
        '`monitors[].status` is `up`, `degraded`, `down` or `unknown`.',
        '`monitors[].uptime` is the uptime in percent over the last hour, 24 hours, 7, 30 and 90 days. `null` means there is no data for that window.',
        '`monitors[].history.daily` has one bucket per UTC day for the last 90 days, oldest first and today last. Each bucket has the `timestamp` it starts at, `successCount`, `failureCount` and `averageLatencyMs`. Every day is present, and a day without checks has both counts at 0.',
        '`monitors[].pings` holds the last checks, up to 100, oldest first, each with `createdAt`, `statusCode` and `responseTimeMs`.',
      ],
    },
    {
      type: 'paragraph',
      text: 'The version is part of the path. New fields may appear in v1, and a change that would break an existing client gets a new version.',
    },
    { type: 'heading', text: 'Status rules' },
    {
      type: 'paragraph',
      text: 'Statuses are computed on the server, so every client shows the same thing. A check is healthy when it answers with a 2xx or 3xx status code. A monitor looks at its latest 10 checks:',
    },
    {
      type: 'list',
      items: [
        '`unknown` when it has no recent checks.',
        '`down` when the 2 latest checks both failed.',
        '`degraded` when any of the 10 failed, but not the 2 latest.',
        '`up` otherwise.',
      ],
    },
    {
      type: 'paragraph',
      text: 'The page status leaves out unknown monitors. When none are left it is `unknown`. When all of them are down it is `outage`, when any of them is down or degraded it is `degraded`, and otherwise it is `operational`.',
    },
    { type: 'heading', text: 'Uptime and history' },
    {
      type: 'paragraph',
      text: 'The 1-hour uptime is computed from individual checks, the 24-hour uptime from hourly buckets, and the 7, 30 and 90-day uptime from the daily buckets in `history.daily`. These are the same windows the README badges use, so a badge and your page agree.',
    },
    {
      type: 'paragraph',
      text: 'Days are UTC, and the bucket for today fills up as the day goes on. Format bucket dates in UTC too, or a visitor west of Greenwich sees every bar labelled with the day before.',
    },
    { type: 'heading', text: 'Caching and freshness' },
    {
      type: 'paragraph',
      text: 'The API composes a status page at most once a minute and answers with `Cache-Control: public, max-age=60`, so browsers and CDNs may reuse a response for another minute. With polling every 60 seconds, what a visitor sees can be up to about three minutes old. Show `updatedAt`, or `lastUpdated` from the client, so they know how fresh it is.',
    },
    {
      type: 'paragraph',
      text: 'Changes to the status page itself, such as its name or its monitors, reach the API right away. Unpublishing stops the API from serving the page at once, though a copy cached by a browser or CDN can live for up to a minute.',
    },
    { type: 'heading', text: 'CORS' },
    {
      type: 'paragraph',
      text: 'The API accepts requests from any origin, so a browser can call it straight from your site. There is no key to keep secret.',
    },
    { type: 'heading', text: 'Errors' },
    {
      type: 'list',
      items: [
        '404 means no status page has that id or verified custom domain.',
        '403 means the status page exists but is not published.',
      ],
    },
    {
      type: 'paragraph',
      text: '`fetchStatusPage` throws a `StatusPageError` with the HTTP status in `error.status`, so you can tell these apart from network errors, which reject with the error `fetch` throws. The React hook and the Svelte binding do not throw: they set `error` and keep the last good data.',
    },
    { type: 'heading', text: 'Source code' },
    {
      type: 'paragraph',
      text: 'The starter and the client library are open source, in [templates/status-page-next](https://github.com/logdash-io/logdash.io/tree/main/templates/status-page-next) and [packages/status](https://github.com/logdash-io/logdash.io/tree/main/packages/status) of the Logdash repository.',
    },
  ],
};
