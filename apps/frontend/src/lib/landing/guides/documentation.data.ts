import { SDK_LIST } from '$lib/domains/logs/domain/sdk-config';
import LogsIcon from '$lib/domains/shared/icons/LogsIcon.svelte';
import MetricsIcon from '$lib/domains/shared/icons/MetricsIcon.svelte';
import MonitoringIcon from '$lib/domains/shared/icons/MonitoringIcon.svelte';
import { LogdashSDKName } from '$lib/domains/shared/types';
import { sdkPath } from '$lib/landing/docs/sdk-doc';
import { sdkDocs } from '$lib/landing/docs/sdk-docs.data';
import type { Pathname } from '$app/types';
import type { Component } from 'svelte';
import type { TableType } from './plan-limits';

export type DocsPath = '/docs' | Extract<Pathname, `/docs/${string}`>;

type IconComponent = Component<{ class?: string }>;

export type DocCard = {
  title: string;
  description: string;
  href: DocsPath;
  icon: IconComponent;
};

/** The hljs grammars the docs and SEO families actually use. */
export type CodeLanguage =
  | 'bash'
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'go'
  | 'csharp'
  | 'java'
  | 'ruby'
  | 'php'
  | 'rust'
  | 'elixir'
  | 'yaml'
  | 'json'
  | 'html'
  | 'powershell'
  | 'svelte'
  | 'text';

export type DocFaqItem = { question: string; answer: string };

/** At most three, and the last one always ends in an alert reaching you. */
export type DocStep = { title: string; text: string };

export type ComparisonWinner = 'logdash' | 'them' | 'tie';

export type DocComparisonRow = {
  feature: string;
  logdash: string;
  them: string;
  winner: ComparisonWinner;
};

export type DocBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'table'; key: TableType }
  | { type: 'cards'; items: DocCard[] }
  | { type: 'sdks' }
  | { type: 'code'; language: CodeLanguage; code: string; title?: string }
  | { type: 'faq'; items: DocFaqItem[] }
  | { type: 'steps'; items: DocStep[] }
  | {
      type: 'comparison';
      /** Rendered above the table, e.g. "Logdash vs Uptime Kuma". */
      title?: string;
      them: string;
      rows: DocComparisonRow[];
    }
  /** Its own block so an all-green comparison table cannot ship. */
  | { type: 'pick-them'; them: string; reasons: string[] };

export interface DocPage {
  path: DocsPath;
  title: string;
  description: string;
  blocks: DocBlock[];
}

export type Sdk = {
  name: string;
  id: LogdashSDKName;
  readmeUrl: string;
  icon: IconComponent;
};

const SDK_REPOS: { name: string; id: LogdashSDKName; repo: string }[] = [
  { name: 'Node.js', id: LogdashSDKName.NODE_JS, repo: 'node-sdk' },
  { name: 'Python', id: LogdashSDKName.PYTHON, repo: 'python-sdk' },
  { name: 'Go', id: LogdashSDKName.GO, repo: 'go-sdk' },
  { name: '.NET', id: LogdashSDKName.DOTNET, repo: 'dotnet-sdk' },
  { name: 'Java', id: LogdashSDKName.JAVA, repo: 'java-sdk' },
  { name: 'Rust', id: LogdashSDKName.RUST, repo: 'rust-sdk' },
  { name: 'Ruby', id: LogdashSDKName.RUBY, repo: 'ruby-sdk' },
  { name: 'PHP', id: LogdashSDKName.PHP, repo: 'php-sdk' },
];

export const SDKS: Sdk[] = SDK_REPOS.map(({ name, id, repo }) => ({
  name,
  id,
  readmeUrl: `https://github.com/logdash-io/${repo}#readme`,
  icon: SDK_LIST.find((sdk) => sdk.name === id)?.icon as IconComponent,
}));

const featureCards: DocCard[] = [
  {
    title: 'Logging',
    description: 'Stream and search logs in real time, from every instance.',
    href: '/docs/logging',
    icon: LogsIcon,
  },
  {
    title: 'Metrics',
    description: 'Track the numbers that matter to your business.',
    href: '/docs/metrics',
    icon: MetricsIcon,
  },
  {
    title: 'Monitoring',
    description: 'Health checks, uptime history and alerts.',
    href: '/docs/monitoring',
    icon: MonitoringIcon,
  },
];

export const docPages: Record<
  | 'introduction'
  | 'logging'
  | 'metrics'
  | 'monitoring'
  | 'statusPages'
  | 'webAnalyticsPrivacy',
  DocPage
> = {
  introduction: {
    path: '/docs',
    title: 'Introduction',
    description:
      'Logdash is logging, metrics and uptime monitoring in one place, with nothing to configure.',
    blocks: [
      {
        type: 'paragraph',
        text: 'Install an SDK, paste your API key and your first logs appear in the dashboard moments later. Depending on your location, a log reaches the dashboard in under 100 ms.',
      },
      { type: 'heading', text: 'Three pillars' },
      { type: 'cards', items: featureCards },
      { type: 'heading', text: 'SDKs' },
      {
        type: 'paragraph',
        text: 'Official SDKs for the languages you already use. Each README covers installation, logging and metrics.',
      },
      { type: 'sdks' },
    ],
  },
  logging: {
    path: '/docs/logging',
    title: 'Logging',
    description:
      'Track events and errors in real time, from every instance of your app.',
    blocks: [
      {
        type: 'paragraph',
        text: 'Send structured logs from your code with a single call and search them the moment they arrive. Several instances of the same service land in one stream, so debugging does not mean hopping between machines.',
      },
      { type: 'heading', text: 'Plan limits' },
      {
        type: 'paragraph',
        text: 'Your plan sets how long logs are kept and how many you can send per hour.',
      },
      { type: 'table', key: 'logsRetention' },
      { type: 'table', key: 'logsRateLimits' },
    ],
  },
  metrics: {
    path: '/docs/metrics',
    title: 'Metrics',
    description:
      'Track the numbers that matter to your business, straight from your application.',
    blocks: [
      {
        type: 'paragraph',
        text: 'Set or mutate a metric from your code and watch it on a chart. Typical examples are user registrations, orders and file uploads, or any other data point that matters to you.',
      },
      { type: 'heading', text: 'Plan limits' },
      {
        type: 'paragraph',
        text: 'Your plan sets how many metrics each service can register and how long their history is kept.',
      },
      { type: 'table', key: 'metricsPerService' },
      { type: 'table', key: 'metricsRetention' },
    ],
  },
  monitoring: {
    path: '/docs/monitoring',
    title: 'Monitoring',
    description:
      'HTTP health checks, uptime history and alerts when things go wrong.',
    blocks: [
      {
        type: 'paragraph',
        text: 'Point a monitor at an endpoint and Logdash checks it as often as your plan allows, down to every 15 seconds. Downtime shows up in the uptime history, triggers an alert and can be shared on a public status page.',
      },
      { type: 'heading', text: 'What you get' },
      {
        type: 'list',
        items: [
          'HTTP health checks every 5 minutes, 1 minute or 15 seconds, by plan',
          'Uptime history and response time tracking',
          'Public status pages with custom domains',
          'A status page API for building your own page in your own design',
          'Alerts on Telegram and webhooks when a check flips to down',
        ],
      },
    ],
  },
  statusPages: {
    path: '/docs/status-pages',
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
          '`down` when the latest check failed.',
          '`degraded` when any of the 10 failed.',
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
    ],
  },
  webAnalyticsPrivacy: {
    path: '/docs/web-analytics-privacy',
    title: 'Web analytics and privacy',
    description:
      'How Logdash counts visitors without cookies, what it stores and for how long, and what to tell your visitors.',
    blocks: [
      {
        type: 'paragraph',
        text: 'The Logdash tracker sets no cookies and keeps nothing in the browser to recognise a visitor. Anonymous visitors are counted on the server with an ID that changes every day, IP addresses are never stored, and signed-in users are recognised only by a hash computed in their browser. This page describes exactly what happens, so you can describe it to your visitors.',
      },
      { type: 'heading', text: 'How visitors are counted' },
      {
        type: 'paragraph',
        text: 'For every event, the Logdash server computes the visitor ID as a SHA-256 hash in hex:',
      },
      {
        type: 'code',
        language: 'javascript',
        code: "sha256(dailySalt + ':' + siteId + ':' + clientIp + ':' + userAgent)",
      },
      {
        type: 'list',
        items: [
          'The daily salt is 32 random bytes, created for each UTC day. It is held only in Redis and expires 30 minutes after that day ends.',
          "Once the salt is gone, nobody can recompute that day's visitor IDs, Logdash included. The same visitor gets a new ID every day.",
          'The IP address is used only to compute the hash and is never stored.',
          'The User-Agent goes into the hash and is reduced to device type, browser and operating system. The full string is not stored.',
          "Behind a first-party proxy, the proxy passes the visitor's IP address in the `x-logdash-client-ip` header, so the hash uses the visitor's address rather than your server's. The proxy forwards `Origin`, `User-Agent` and `x-logdash-client-ip`, never cookies, authorization headers or ingest keys.",
        ],
      },
      {
        type: 'paragraph',
        text: "Sessions live on the server too. A session ends after 30 minutes without events or after 24 hours, and the next event starts a new one. During the first 30 minutes of a UTC day, a visitor whose session started the day before continues that session and keeps the previous day's visitor ID.",
      },
      {
        type: 'paragraph',
        text: 'Because the ID changes every day, an anonymous visitor who comes back the next day counts as a new visitor. Retention, stickiness and comebacks are measured for identified users only.',
      },
      { type: 'heading', text: 'Identify signed-in users' },
      {
        type: 'paragraph',
        text: 'Once your app knows who is signed in, pass their user ID to `identify`. The identity lives in memory only, so call it on every page load, and call it with `null` when the user signs out.',
      },
      {
        type: 'code',
        language: 'javascript',
        title: 'On every page load, once the user is known',
        code: 'window.logdash?.identify(user.id);',
      },
      {
        type: 'code',
        language: 'javascript',
        title: 'On sign-out',
        code: 'window.logdash?.identify(null);',
      },
      {
        type: 'paragraph',
        text: "The tracker hashes the ID in the browser before anything is sent: `sha256(siteId + ':' + id)`, in lowercase hex. The raw ID never leaves the browser. Because the site ID is part of the hash, the same user ID gives a different hash on every site.",
      },
      {
        type: 'list',
        items: [
          '`id` is a string or a number. `null`, `undefined` or an empty string clears the identity, and events tracked after that are sent without a user ID.',
          'A value that contains `@` or is longer than 256 characters is ignored with a console warning and leaves the identity as it was, so an email address is never sent by mistake.',
          'Hashing needs `crypto.subtle`, which browsers offer only in secure contexts such as HTTPS pages. Without it, `identify` does nothing.',
          'Events of the page load that are still waiting to be sent when the hash is ready get the user ID too, so the first pageview is attributed when `identify` follows within about a second.',
          'The server never copies a user ID onto an event sent without one, so events after sign-out are not attributed to the previous user.',
        ],
      },
      {
        type: 'paragraph',
        text: 'Pass a stable internal ID, never an email address or a name. The hash is pseudonymous, not anonymous: your site ID is public in the script tag, so anyone can hash guessable IDs, such as small sequential numbers, and compare.',
      },
      { type: 'heading', text: 'Track custom events' },
      {
        type: 'paragraph',
        text: 'Call `track` for the actions you want to count, such as `signup_completed`. Event names match `[a-z][a-z0-9_]{0,63}`. To break an event down in the dashboard, pass a flat object of properties as the second argument.',
      },
      {
        type: 'code',
        language: 'javascript',
        code: "window.logdash?.track('video_played', { quality: '1080p', autoplay: true, chapter: 2 });",
      },
      {
        type: 'list',
        items: [
          'An event carries at most 10 properties. Keys match `[a-z][a-z0-9_]{0,39}`.',
          'Values are strings, numbers or booleans. They are stored as strings, trimmed and cut to 100 characters, so `2` and `true` become `"2"` and `"true"`.',
          'A value that contains `@` or a control character is dropped, so an email address is never stored by mistake.',
          'Invalid properties are dropped with one console warning per page load, and the event is still sent. The API checks every request against the same rules.',
          'Only custom events carry properties. `pageview`, `pageleave` and `browser_error` never do.',
          'Each property keeps up to 500 distinct values per site within your retention period, and later values are counted as `(other)`. A site can use up to 50 property keys, and properties with further keys are dropped.',
        ],
      },
      {
        type: 'paragraph',
        text: 'Never put emails, names, user IDs, purchase details or other personal data in event names or properties. Properties describe what happened, such as a quality, a theme or a variant, never who did it. Use `identify` for the signed-in user.',
      },
      {
        type: 'paragraph',
        text: 'In the dashboard, open an event from the Goals card to see its trend and a breakdown by each property, with the same date range and filters as the other reports. Clicking a value filters every report to the visitors who sent it.',
      },
      { type: 'heading', text: 'Let visitors opt out' },
      {
        type: 'paragraph',
        text: 'The tracker does not start in browsers that send Do Not Track or Global Privacy Control, or in automated browsers that set `navigator.webdriver`.',
      },
      {
        type: 'paragraph',
        text: 'If your site has privacy settings, add an analytics toggle that calls `optOut` and `optIn`:',
      },
      {
        type: 'code',
        language: 'javascript',
        code: `window.logdash?.optOut();
window.logdash?.optIn();`,
      },
      {
        type: 'list',
        items: [
          "`optOut()` stops tracking at once: it drops queued events and removes its timers, listeners and history hooks. It writes `localStorage['logdash:opt-out'] = '1'` so the choice survives reloads.",
          '`optIn()` removes that flag and starts tracking again with a fresh pageview. `window.logdash` exists while a visitor is opted out, so `optIn()` stays reachable.',
          '`stop()` still works as an alias of `optOut()`.',
        ],
      },
      {
        type: 'paragraph',
        text: 'Apart from that flag, written only when a visitor opts out, the tracker sets no cookies and writes nothing to `localStorage` or `sessionStorage`. On load it deletes the `ldv_` and `lds_` cookies that earlier versions of the tracker set.',
      },
      { type: 'heading', text: 'What Logdash stores' },
      {
        type: 'paragraph',
        text: 'Each event is stored with:',
      },
      {
        type: 'list',
        items: [
          'the event name: `pageview`, `pageleave`, `browser_error` or one of your custom events. `browser_error` carries no error message or stack trace.',
          'for custom events, the properties you pass to `track`, after the checks described above.',
          'the host name and path of the page, without query string or fragment. Path segments that contain `@` become `:redacted`, and segments that look like database IDs, UUIDs or numbers of four or more digits become `:id`.',
          'the host name of the referring site, UTM source, medium, campaign and term, and the name of an ad click ID parameter such as `gclid`, never its value. They come from the first event of the session.',
          'device type, browser and operating system, derived from the User-Agent.',
          "a country, derived from the browser's time zone rather than the IP address.",
          'the time of the event.',
          'the visitor ID, a random session ID and, for identified users, the user hash.',
        ],
      },
      {
        type: 'paragraph',
        text: "While a session is live, its ID, start time and attribution are held in Redis. They expire 30 minutes after the session's last event.",
      },
      { type: 'heading', text: 'How long data is kept' },
      {
        type: 'paragraph',
        text: 'Events are deleted automatically when the retention period of your plan has passed, counted from the time of each event. The retention that applies is the one of the plan you had when the event arrived.',
      },
      { type: 'table', key: 'webAnalyticsRetention' },
      {
        type: 'paragraph',
        text: 'Deleting a domain in Logdash deletes all of its web analytics events. Copies in encrypted backups are deleted when the backups expire, 14 days after they were made.',
      },
      { type: 'heading', text: 'Consent' },
      {
        type: 'paragraph',
        text: 'Whether your site needs consent for analytics depends on the law that applies to you and your visitors, and on how you use the data. You decide that, not Logdash. This page and the data processing agreement describe the processing precisely, so you can make that decision and explain it to your visitors. If you decide you need consent, load the script only after the visitor agrees.',
      },
      { type: 'heading', text: 'Text for your privacy policy' },
      {
        type: 'paragraph',
        text: 'Adapt this text to your site: fill in the parts in square brackets, remove the bracketed sentences that do not apply, and change the legal basis if you rely on consent.',
      },
      {
        type: 'code',
        language: 'text',
        code: `We measure how this website is used with Logdash web analytics. It sets no cookies and stores nothing in your browser to recognise you. To count visits, Logdash computes a pseudonymous visitor ID on its server: a SHA-256 hash of your IP address, your browser's User-Agent, our site ID and a random value that changes every day and is deleted 30 minutes after the day ends (UTC). Your IP address is not stored, and anonymous visits on different days are not linked to each other.

For each page you visit, we collect the page address without query parameters, the domain of the website that referred you, campaign tags, your device type, browser and operating system, and a country derived from your time zone. [When you are signed in, your visits are also linked to a pseudonymous hash of your account ID, computed in your browser. Your account ID itself is not sent.] [For some actions, such as [actions], we also record the options you chose, never personal data.]

Logdash processes this data on our behalf as a processor and deletes it after [retention period]. We process it on the basis of our legitimate interest in understanding how our website is used and improving it (Art. 6(1)(f) GDPR). The analytics does not run if your browser sends Global Privacy Control or Do Not Track. [You can also turn analytics off in our privacy settings.] To object or to ask about your data, contact [contact address].`,
      },
      { type: 'heading', text: 'Data processing agreement' },
      {
        type: 'paragraph',
        text: 'When you use Logdash for web analytics or logs, Logdash processes personal data on your behalf as a processor. The data processing agreement covers the subject and duration of the processing, the categories of data, the security measures, the sub-processors, breach notification and deletion.',
      },
    ],
  },
};

export type DocsSidebarItem =
  | { title: string; href: DocsPath; external: false; icon?: IconComponent }
  | { title: string; href: string; external: true; icon?: IconComponent };

export type DocsSidebarGroup = {
  title: string;
  items: DocsSidebarItem[];
};

export const docsSidebar: DocsSidebarGroup[] = [
  {
    title: 'Get started',
    items: [
      { title: 'Introduction', href: '/docs', external: false },
      { title: 'Logging', href: '/docs/logging', external: false },
      { title: 'Metrics', href: '/docs/metrics', external: false },
      { title: 'Monitoring', href: '/docs/monitoring', external: false },
      { title: 'Status pages', href: '/docs/status-pages', external: false },
    ],
  },
  {
    title: 'SDKs',
    /**
     * These used to point at the GitHub READMEs. They are our own reference
     * pages now, so the sidebar keeps the reader on the site.
     *
     * No icons: the sidebar is a plain list of titles, and an icon on the
     * eight SDK rows but not on Overview leaves the column ragged.
     */
    items: [
      { title: 'Overview', href: '/docs/sdks', external: false },
      ...sdkDocs.map((doc) => ({
        title: doc.name,
        href: sdkPath(doc),
        external: false as const,
      })),
    ],
  },
  {
    title: 'More',
    items: [
      { title: 'Self-hosting', href: '/docs/self-hosting', external: false },
      {
        title: 'Web analytics privacy',
        href: '/docs/web-analytics-privacy',
        external: false,
      },
    ],
  },
];
