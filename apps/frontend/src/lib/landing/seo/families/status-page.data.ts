import type { SeoFamily, SeoFamilyData, SeoPage } from '../seo-page';

/**
 * Family H. The intent is "get a status page that tells the truth", so every
 * page leads with the code that renders one, the public JSON API, the
 * component or the Next.js starter, and says plainly where hosted tools win.
 *
 * The hub carries its own article for "status page", with "custom status
 * page" only in its title and description, because the custom page owns
 * that H1 and the two must not compete for it.
 */
export const statusPagesFamily: SeoFamily = {
  key: 'status-page',
  hubPath: '/status-page',
  hubLabel: 'All status page guides',
  title: 'Status page and custom status page | Logdash',
  description:
    'A status page fed by real uptime checks: hosted by Logdash, a custom status page on your own domain, or your own build on a public JSON API. Free plan included.',
  intro:
    'One page per question, from the status page API to a free page on your own domain.',
  hub: {
    h1: 'Status page',
    answer:
      'A status page is a public page that says whether your product works right now and how it did over the last 90 days, and Logdash builds one from its own uptime checks, so it turns red on the next failed check without anyone updating it by hand.',
    meta: {
      title: 'Status page and custom status page | Logdash',
      description:
        'A status page fed by real uptime checks: hosted by Logdash, a custom status page on your own domain, or your own build on a public JSON API. Free plan included.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'Most status pages are updated by a person. During an outage that person is busy fixing the outage, so the page keeps saying all systems operational well into the outage, which is exactly when customers open it. A status page earns its keep only if it turns red without anyone touching it.',
      },
      {
        type: 'paragraph',
        text: 'A Logdash status page reads from the same HTTP checks that alert you. Each monitor is checked every 5 minutes on the free plan, every minute on Builder and every 15 seconds on Pro, and the page shows what those checks saw.',
      },
      { type: 'heading', text: 'What the page shows' },
      {
        type: 'list',
        items: [
          'One overall status: operational, degraded or outage.',
          'A row per monitor with its uptime over 24 hours, 7, 30 and 90 days.',
          '90 daily bars per monitor, each with its checks and average latency.',
          'A response time chart over the last 100 checks, and when the data was last updated.',
          'No incident posts, maintenance windows or subscriber emails. The page reports checks, not prose.',
        ],
      },
      { type: 'heading', text: 'How the status is decided' },
      {
        type: 'list',
        items: [
          'A check is up when it gets a 2xx or 3xx answer. Anything else, or no answer within 10 seconds, is down.',
          'A monitor is down when its latest check failed, degraded when any of its last 10 checks failed, and up otherwise.',
          'The page is in outage when every monitor is down, degraded when any monitor is not up, and operational when all are up.',
          'Uptime is successful checks over total checks in the window.',
          'The page is composed at most once a minute, so what a visitor sees can be up to about three minutes old. The Telegram alert does not wait for it.',
        ],
      },
      { type: 'heading', text: 'Your domain or your own design' },
      {
        type: 'paragraph',
        text: 'The hosted page lives at `logdash.io/d/<id>` on every plan. On Pro, one CNAME to `statuspage.logdash.io` puts it on a subdomain such as `status.example.com`, with HTTPS handled for you. The other route works on any plan: every published page is also public JSON with no API key, so you can render it in your own app with the MIT React or Svelte component, or deploy the Next.js starter on any domain you own.',
      },
      {
        type: 'code',
        language: 'bash',
        title: "Logdash's own status page, as JSON",
        code: `curl -s https://api.logdash.io/v1/status_pages/status.logdash.io \\
  | jq '{status, updatedAt, monitors: [.monitors[] | {name, status}]}'`,
      },
      {
        type: 'paragraph',
        text: 'Wherever it ends up, host it apart from your app. A status page that shares servers, deploys or DNS with the product goes down with it, at the one moment people come looking.',
      },
      {
        type: 'comparison',
        title: 'Logdash vs hand-updated status page tools',
        them: 'Statuspage, incident.io',
        rows: [
          {
            feature: 'What turns the page red',
            logdash: 'The next failed check',
            them: 'A person, or a monitoring tool you connect',
            winner: 'logdash',
          },
          {
            feature: 'Incident posts and maintenance',
            logdash: 'None',
            them: 'Written by you, free plans included',
            winner: 'them',
          },
          {
            feature: 'Subscribers on the free plan',
            logdash: 'None',
            them: '100 on Statuspage, unlimited on incident.io',
            winner: 'them',
          },
          {
            feature: 'Your own domain',
            logdash: 'Pro at $15, or your own build on any plan',
            them: 'Statuspage from $29, incident.io free',
            winner: 'tie',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'a dedicated status page tool',
        reasons: [
          'You write incident updates by hand and want customers to subscribe to them by email or SMS. Logdash has no incident editor and no subscriber list.',
          'You announce scheduled maintenance on the page. Logdash shows checks only.',
          'Your monitoring already lives elsewhere and only the communication layer is missing.',
        ],
      },
      { type: 'heading', text: 'Set it up' },
      {
        type: 'steps',
        items: [
          {
            title: 'Add your monitors',
            text: 'Add one Logdash HTTP monitor per thing customers can tell apart, such as the app and the API, and point each at a health URL.',
          },
          {
            title: 'Publish the page',
            text: 'Pick the monitors, name the page and publish it. The free plan includes one status page and five monitors.',
          },
          {
            title: 'Break one on purpose',
            text: 'Connect Telegram and make one health URL return a 503. The row turns red within a few minutes, and the Telegram alert reaches you first, with the monitor name and status code.',
          },
        ],
      },
    ],
    faq: [
      {
        question: 'What is a status page?',
        answer:
          'A public page, usually on a status subdomain, that says whether your product works right now and how it did recently. Customers check it before they email you, so a page that stays green through an outage costs you trust twice.',
      },
      {
        question: 'How does a status page know my app is down?',
        answer:
          'Either a person sets it, or a monitor does. Logdash pages follow HTTP checks from outside your network, so a failed check turns the row red with nobody in the loop.',
      },
      {
        question: 'Is a Logdash status page free?',
        answer:
          'Yes. The free plan includes one published status page, five monitors checked every 5 minutes, Telegram and webhook alerts and the public status page API. A custom domain on the hosted page needs Pro.',
      },
      {
        question: 'Where should a status page be hosted?',
        answer:
          'Anywhere your app is not. The hosted Logdash page runs on Logdash infrastructure. If you build your own, give it its own project and subdomain so one outage cannot take both down.',
      },
    ],
  },
};

export const statusPagesPages: SeoPage[] = [
  {
    slug: 'api',
    h1: 'Status page API',
    answer:
      'Every status page you publish in Logdash is also public JSON at api.logdash.io/v1/status_pages/:id, with no API key and CORS open to any origin, so you can render it on your own site in your own design.',
    meta: {
      title: 'Status page API: public JSON, no key | Logdash',
      description:
        'One public endpoint per status page. Curl it or use the typed @logdash/status client. The real response shape, caching rules, and how it compares to the Statuspage API.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'Most status page products give you a hosted page and stop there. The page lives on their domain in their fonts, and anything beyond it means scraping HTML. Logdash serves the data its hosted page renders as JSON, one endpoint per page. Anything that can make an HTTP request can read it: your marketing site, a banner inside your app, a CLI, a menu bar widget.',
      },
      { type: 'heading', text: 'Call the status page API with curl' },
      {
        type: 'code',
        language: 'bash',
        code: `curl https://api.logdash.io/v1/status_pages/status.logdash.io`,
      },
      {
        type: 'paragraph',
        text: 'That is the Logdash status page itself, so the command works as pasted. Swap in your own status page id, which is the last part of its public logdash.io/d/ URL, or a verified custom domain such as `status.example.com`. The page has to be published: a draft answers 403 and an unknown id answers 404.',
      },
      { type: 'heading', text: 'The response shape' },
      {
        type: 'code',
        language: 'json',
        code: `{
  "name": "Acme",
  "status": "operational",
  "updatedAt": "2026-10-02T12:00:00.000Z",
  "monitors": [
    {
      "id": "Xq3vN8kP2mLw",
      "name": "API",
      "status": "up",
      "uptime": { "1h": 100, "24h": 100, "7d": 99.98, "30d": 99.95, "90d": 99.97 },
      "history": {
        "daily": [
          {
            "timestamp": "2026-10-02T00:00:00.000Z",
            "successCount": 720,
            "failureCount": 0,
            "averageLatencyMs": 182
          }
        ]
      },
      "pings": [
        { "createdAt": "2026-10-02T11:59:00.000Z", "statusCode": 200, "responseTimeMs": 175 }
      ]
    }
  ]
}`,
      },
      {
        type: 'list',
        items: [
          '`status` is the whole page: `operational`, `degraded`, `outage` or `unknown`.',
          '`monitors[].status` is `up`, `degraded`, `down` or `unknown`, computed on the server from the latest 10 checks, so every client shows the same thing.',
          '`uptime` is a percentage over 1 hour, 24 hours, 7, 30 and 90 days. `null` means no checks in that window.',
          '`history.daily` always has 90 UTC days, oldest first, each with success and failure counts and average latency.',
          '`pings` holds the last 100 checks, each with its status code and response time.',
        ],
      },
      { type: 'heading', text: 'Use the typed client' },
      {
        type: 'paragraph',
        text: '`@logdash/status` on npm wraps the same endpoint with types generated from the OpenAPI spec and zero runtime dependencies. `fetchStatusPage` makes one request and throws a `StatusPageError` carrying the HTTP status, so a 404 is easy to tell apart from a network failure.',
      },
      {
        type: 'code',
        language: 'typescript',
        code: `import { fetchStatusPage } from '@logdash/status';

const page = await fetchStatusPage('status.logdash.io');

console.log(page.name, page.status);
for (const monitor of page.monitors) {
  console.log(monitor.name, monitor.status, monitor.uptime['90d']?.toFixed(2));
}`,
      },
      {
        type: 'paragraph',
        text: 'For a live page, the React hook and the Svelte binding poll every 60 seconds, pause in hidden tabs and keep the last good data when a request fails. That last part is what most people get wrong when they write a headless status page from scratch: the first network blip blanks the page at the exact moment visitors are reading it.',
      },
      { type: 'heading', text: 'Caching and limits' },
      {
        type: 'paragraph',
        text: 'The server composes a page at most once a minute and answers with `Cache-Control: public, max-age=60`, so polling faster brings nothing new, and what a visitor sees can be up to about three minutes old. Show `updatedAt` so they know. The API is read only. Incidents, maintenance windows and subscriber emails are not in it, because the hosted page does not have them either.',
      },
      {
        type: 'heading',
        text: 'Statuspage API vs the Logdash status page API',
      },
      {
        type: 'comparison',
        title: 'Logdash vs Atlassian Statuspage',
        them: 'Statuspage',
        rows: [
          {
            feature: 'Public read endpoint',
            logdash: 'One JSON URL per page, no key',
            them: 'summary.json on every page, no key',
            winner: 'tie',
          },
          {
            feature: 'Where status comes from',
            logdash: 'HTTP checks every 5 minutes to 15 seconds',
            them: 'Set by hand or by an integration',
            winner: 'logdash',
          },
          {
            feature: 'Write API',
            logdash: 'None, the API only reads',
            them: 'Manage API, with an API key',
            winner: 'them',
          },
          {
            feature: 'Incidents and maintenance',
            logdash: 'Not in the data',
            them: 'Incidents, scheduled maintenance, components',
            winner: 'them',
          },
          {
            feature: 'Building your own page',
            logdash:
              'MIT typed client, React and Svelte components, Next.js starter',
            them: 'A JavaScript embed library',
            winner: 'logdash',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Statuspage',
        reasons: [
          'You post incidents and maintenance windows and want them in the JSON. Logdash has no incident model at all.',
          'You need to write status from code, such as opening an incident from a deploy script. The Logdash API only reads.',
          'Your status covers things an HTTP check cannot see, and a person sets it by hand.',
        ],
      },
      { type: 'heading', text: 'From zero to a page that alerts you' },
      {
        type: 'steps',
        items: [
          {
            title: 'Publish a status page',
            text: 'Add your monitors to a status page in Logdash, publish it and copy the id from the Build your own section.',
          },
          {
            title: 'Fetch it',
            text: 'Curl the endpoint or install @logdash/status. The JSON is the same on every plan. Only the check interval changes: 5 minutes free, 1 minute on Builder, 15 seconds on Pro.',
          },
          {
            title: 'Break something on purpose',
            text: 'Stop the service behind one monitor. The next check fails, its status in the JSON turns down, and a Telegram alert lands saying the monitor is down, with the status code and the error.',
          },
        ],
      },
      {
        type: 'paragraph',
        text: 'The full field reference, status rules and error codes live in the docs at /docs/status-pages.',
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'Does the status page API need an API key?',
        answer:
          'No. Reading a published status page needs no key and no account, and CORS allows any origin, so a browser can call it straight from your site. There is nothing secret to leak. Creating and editing status pages happens in the Logdash dashboard, and personal API keys do not reach those endpoints today.',
      },
      {
        question: 'Where is the status page API documentation?',
        answer:
          'At /docs/status-pages on logdash.io. It covers every response field, the status rules, caching, CORS and errors, plus the client library, the shadcn component and the Next.js starter. The version is part of the path, and a change that would break an existing client gets a new version.',
      },
      {
        question: 'Is there an Uptime Kuma status page API?',
        answer:
          'Yes. A published Kuma status page answers at /api/status-page/:slug with its config and at /api/status-page/heartbeat/:slug with recent heartbeats and a 24-hour uptime per monitor. Kuma documents it on its internal API wiki page, which says that API is meant for the app itself and not officially supported for third-party use.',
      },
      {
        question: 'Is there a Cloudflare status page API?',
        answer:
          'Yes. cloudflarestatus.com runs on Atlassian Statuspage, so the standard v2 endpoints work with no key: /api/v2/status.json for the overall indicator and /api/v2/summary.json for components and open incidents. It tells you about Cloudflare, not about your app behind it.',
      },
      {
        question:
          'Is there an AWS status page API or an Azure status page API?',
        answer:
          'Not a public, documented one. The AWS Health API covers events for your own account and needs a Business Support+, Enterprise or Unified Operations plan. Azure publishes an RSS feed of broad incidents, and its Resource Health REST API covers your subscription behind Azure sign-in. A check on your own endpoint catches the outages that actually touch you.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'open-source',
    h1: 'Open source status page',
    answer:
      'Logdash is AGPL-3.0 and its status page client, components and Next.js starter are MIT, but the checks and the data run on hosted Logdash, so if the whole stack must run on your own hardware, Uptime Kuma, Gatus or Upptime are the honest picks.',
    meta: {
      title: 'Open source status page: what is open, what is not | Logdash',
      description:
        'Which parts of a Logdash status page are open source, AGPL-3.0 app and MIT client and components, where the data lives, and how it compares to Uptime Kuma and Upptime.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: '"Open source" means three different things on a status page, and most comparisons blur them. Can you read the code? Can you change the page? Can you run the whole thing, checks included, on a box you own? For Logdash the answers are yes, yes and not yet. Better to say that up front than have a self-hoster find out after an evening of setup.',
      },
      { type: 'heading', text: 'What is open, and under which license' },
      {
        type: 'list',
        items: [
          'The Logdash app, backend and frontend, is AGPL-3.0 in a public GitHub repository. Change it and serve it to others, and you publish your changes.',
          '`@logdash/status`, the typed client with React and Svelte bindings, is MIT, with zero runtime dependencies.',
          'The shadcn components for React and Svelte are MIT. They live in the same package and get copied into your codebase, so after install they are your code.',
          'The Next.js starter in `templates/status-page-next` is MIT too. Fork it, strip it, ship it.',
          'The data is not something you host. Checks run on Logdash infrastructure, and your page reads them from the public API.',
        ],
      },
      {
        type: 'paragraph',
        text: 'The split is deliberate. The AGPL keeps the monitoring product open. MIT on everything that ends up inside your own app means no copyleft question in your repository when you install a component.',
      },
      {
        type: 'heading',
        text: 'Build an open source status page on top of it',
      },
      {
        type: 'code',
        language: 'bash',
        code: `npx shadcn add https://logdash.io/r/react/status-page.json`,
      },
      {
        type: 'code',
        language: 'typescript',
        title: 'app/status/page.tsx',
        code: `import { StatusPage } from '@/components/status-page';

export default function Page() {
  return <StatusPage statusPageId="your-status-page-id" />;
}`,
      },
      {
        type: 'paragraph',
        text: 'That renders an overall status banner, a row per monitor with its uptime and 90 days of history bars, styled by the shadcn CSS variables of your Tailwind theme. Svelte gets the same component through shadcn-svelte. The file sits in your repository, so every line of it is yours to change.',
      },
      { type: 'heading', text: 'Open source status page software, compared' },
      {
        type: 'list',
        items: [
          'Uptime Kuma, MIT. The most popular self-hosted monitor, with dozens of notification providers, plus incidents and maintenance windows on its status page. One Docker container.',
          'Gatus, Apache 2.0. Checks live in a YAML file in git and run from one Go binary, including DNS, TCP, ICMP and certificate checks.',
          'Upptime, MIT. Runs on GitHub Actions, Issues and Pages, so there is no server at all. Checks run at most every 5 minutes, the Actions schedule floor.',
          'Cachet. Built around incident communication. The BSD-3-Clause 2.x line has had no release since 2023, and the 3.x rebuild says it is not completely ready for production.',
          'openstatus, AGPL-3.0 like Logdash. Hosted or self-hosted with Docker, with monitors declared as code.',
        ],
      },
      {
        type: 'comparison',
        title: 'Logdash vs openstatus',
        them: 'openstatus',
        rows: [
          {
            feature: 'License',
            logdash: 'AGPL-3.0 app, MIT client and components',
            them: 'AGPL-3.0',
            winner: 'tie',
          },
          {
            feature: 'Whole stack on your own hardware',
            logdash: 'Not today, no one-command install',
            them: 'Documented Docker Compose setup',
            winner: 'them',
          },
          {
            feature: 'Free hosted plan',
            logdash: '5 monitors, checked every 5 minutes',
            them: '1 monitor, checked every 10 minutes',
            winner: 'logdash',
          },
          {
            feature: 'Incidents, maintenance, subscribers',
            logdash: 'Not supported',
            them: 'All three, subscribers by email, RSS or webhook',
            winner: 'them',
          },
          {
            feature: 'Cheapest plan with your own domain',
            logdash: 'Pro, $15 a month',
            them: 'Starter, $30 a month',
            winner: 'logdash',
          },
          {
            feature: 'Page in your own design',
            logdash: 'MIT React and Svelte component, Next.js starter',
            them: 'Its own layout, or a fork of the AGPL code',
            winner: 'logdash',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'openstatus',
        reasons: [
          'You want an AGPL-3.0 tool you can run end to end on your own hardware today, from a documented Docker Compose file.',
          'You post incidents and maintenance windows and want subscribers told by email, RSS or webhook. Logdash has none of the three.',
          'You want every check run from many regions at once. openstatus runs each monitor from 6 of its 28 regions on Starter and from all 28 on Pro.',
        ],
      },
      { type: 'heading', text: 'Set it up' },
      {
        type: 'steps',
        items: [
          {
            title: 'Publish a page',
            text: 'Add monitors in Logdash and publish a status page. The free plan includes one, with each monitor checked every 5 minutes.',
          },
          {
            title: 'Pull the code in',
            text: 'Run the shadcn command or deploy the Next.js starter, and pass it the status page id.',
          },
          {
            title: 'Prove it alerts',
            text: 'Connect @logdash_uptime_bot in Telegram and stop one service. On the next check the monitor flips to down and the bot sends you a Telegram alert with its name, the status code and the error.',
          },
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'Is there an open source status page on GitHub?',
        answer:
          'Plenty. Uptime Kuma, Gatus, Upptime, Cachet and openstatus all live on GitHub. Logdash is in logdash-io/logdash.io under AGPL-3.0, and the MIT Next.js starter sits in templates/status-page-next of the same repository.',
      },
      {
        question: 'What is the best open source status page software?',
        answer:
          'The one whose trade you can live with. Uptime Kuma if you want a UI and will run a server, Gatus if your checks belong in git, Upptime if you want no server at all, Logdash if you want to own the page code without babysitting the monitor.',
      },
      {
        question: 'Is there a free open source status page?',
        answer:
          'All of the tools on this page are free to use. The Logdash free plan includes one published status page and five monitors checked every 5 minutes, and the MIT client, component and starter cost nothing on any plan. The self-hosted options are free apart from the server.',
      },
      {
        question: 'Is there an open source status page aggregator?',
        answer:
          'Logdash is not one: it shows your own monitors only. For vendor status in one view, StatusGator publishes an open source status-page-aggregator that reads any Atlassian Statuspage page, and multi-status is a web app covering AWS, Azure, GitHub and many more.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'self-hosted',
    h1: 'Free status page self hosted',
    answer:
      'Run the MIT-licensed Logdash Next.js starter on your own server or in Docker for a free self-hosted status page, while the checks behind it stay on the Logdash free plan, because the monitoring itself does not self-host in one command yet.',
    meta: {
      title: 'Free self-hosted status page | Logdash',
      description:
        'Self-host the status page with an MIT Next.js starter and Docker, for free. The uptime checks stay hosted, because they do not self-host in one command yet.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'A status page has two halves. The page is HTML that tells visitors what is up. The checks are what make that HTML true: something outside your stack hitting your endpoints every few minutes and remembering the answers. Self-hosting the page is cheap and boring. Self-hosting the checks means running a monitor that has to survive the outage it is supposed to report.',
      },
      {
        type: 'paragraph',
        text: 'With Logdash you self-host the page and leave the checks hosted. The free plan covers 5 HTTP monitors checked every 5 minutes, 1 published status page and Telegram alerts. The page reads that status page from a public JSON API with no key, so it runs on any box you own. A custom domain on the hosted page needs Pro. A self-hosted page on `status.yourdomain.com` does not, because the domain points at your server, not ours.',
      },
      { type: 'heading', text: 'Status page self hosted with Docker' },
      {
        type: 'paragraph',
        text: 'The starter is a small Next.js 16 app: one page, one component, Tailwind. Create it without installing, so the container installs its own Linux binaries.',
      },
      {
        type: 'code',
        language: 'bash',
        code: `npx create-next-app@latest status-page \\
  --example https://github.com/logdash-io/logdash.io \\
  --example-path templates/status-page-next \\
  --skip-install
cd status-page`,
      },
      {
        type: 'code',
        language: 'yaml',
        title: 'compose.yaml',
        code: `services:
  status-page:
    image: node:22-alpine
    working_dir: /app
    volumes:
      - ./:/app
    environment:
      LOGDASH_STATUS_PAGE_ID: your-status-page-id
    command: sh -c "npm install && npm run build && npm start"
    ports:
      - "3000:3000"
    restart: unless-stopped`,
      },
      {
        type: 'paragraph',
        text: 'Run `docker compose up -d` and open port 3000. The build fetches your status page once, so a wrong id fails with a 404 and an unpublished page with a 403, instead of shipping a blank page. After that, Next.js renders the page again at most every 60 seconds and the browser polls every 60 seconds. If the Logdash API cannot be reached, the page keeps the last data it had.',
      },
      {
        type: 'paragraph',
        text: 'Host it apart from your app. People open a status page when your app is down, and a page that shares a server, a deploy or a DNS setup with the app goes down with it. A small VPS at a different provider, or its own Vercel project, is enough.',
      },
      { type: 'heading', text: 'Can the checks be self-hosted too?' },
      {
        type: 'paragraph',
        text: 'The starter, the shadcn component and the `@logdash/status` client are MIT. Fork them, restyle them, delete what you do not need. The Logdash server that runs the checks is AGPL-3.0 and public, but production self-hosting is not supported today. The backend does not boot without Stripe and Resend keys, login is GitHub or Google OAuth only, and there is no published image or compose file that runs the apps. It runs locally for development. The full list of blockers is at /docs/self-hosting.',
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Publish a status page',
            text: 'Add an HTTP monitor per app in Logdash, point each at a health URL, add the monitors to a status page and publish it. Copy the id from the Build your own section.',
          },
          {
            title: 'Start the container',
            text: 'Paste the id into compose.yaml, run docker compose up -d on a host that shares nothing with your app, and point status.yourdomain.com at port 3000 through your reverse proxy.',
          },
          {
            title: 'Break it once',
            text: 'Stop your app. Within one 5-minute check the monitor flips to down, and your self-hosted page shows it within about 3 minutes of that. The Telegram alert does not wait: it arrives at the flip, with the monitor name and status code.',
          },
        ],
      },
      {
        type: 'comparison',
        title: 'Logdash starter vs Uptime Kuma',
        them: 'Uptime Kuma',
        rows: [
          {
            feature: 'Checks self-hosted too',
            logdash: 'No, checks run on Logdash',
            them: 'Yes, one container',
            winner: 'them',
          },
          {
            feature: 'Checks survive your server dying',
            logdash: 'Yes, they run elsewhere',
            them: 'No, they die with the host',
            winner: 'logdash',
          },
          {
            feature: 'Monitor types',
            logdash: 'HTTP checks, push heartbeats on Pro',
            them: 'HTTP, TCP, ping, DNS, keyword and more',
            winner: 'them',
          },
          {
            feature: 'Incident notes and maintenance',
            logdash: 'Not built in',
            them: 'Pinned incident banner and maintenance windows',
            winner: 'them',
          },
          {
            feature: 'Page design',
            logdash: 'Your own React code with your Tailwind theme',
            them: 'Built-in layout plus custom CSS',
            winner: 'logdash',
          },
          {
            feature: 'Cost',
            logdash: 'Free plan plus the box',
            them: 'Free plus the box',
            winner: 'tie',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Uptime Kuma',
        reasons: [
          'Every byte, check history included, has to stay on your hardware.',
          'You need TCP, DNS, ping or keyword checks. Logdash has none of them.',
          'You want to post incident notes and schedule maintenance on the page itself.',
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'Can I get a free status page self hosted?',
        answer:
          'Yes. The starter is MIT and costs nothing to run beyond the server. The data comes from a Logdash status page, and the free plan includes one with 5 monitors checked every 5 minutes.',
      },
      {
        question: 'What is the best self hosted status page?',
        answer:
          'If everything, checks included, must run on your hardware, Uptime Kuma: one container, many monitor types. If you want the page on your server and the checks somewhere that survives your server, the Logdash starter.',
      },
      {
        question: 'How do I run a status page self hosted in Docker?',
        answer:
          'Create the starter with create-next-app and --skip-install, then run the compose.yaml above with node:22-alpine and your status page id. It builds once, then serves on port 3000.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'free',
    h1: 'Free status page',
    answer:
      'The free Logdash Hobby plan includes one public status page fed by up to 5 HTTP monitors checked every 5 minutes, plus Telegram and webhook alerts, uptime badges and the status page API, with no credit card and no trial clock.',
    meta: {
      title: 'Free status page with built-in monitoring | Logdash',
      description:
        'What a free status page includes in 2026: the Logdash free plan in full, compared with the Instatus, Better Stack and Atlassian Statuspage free tiers.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'Many free status page tools give you the page and nothing behind it. Somebody still has to decide the API is down. A free status page only helps if the thing that turns it red is free as well, so the comparison below counts monitors and check intervals, not just pages.',
      },
      { type: 'heading', text: 'What the free plan includes' },
      {
        type: 'list',
        items: [
          'One public status page at `logdash.io/d/<id>`, with overall status, uptime per monitor over 24 hours, 7, 30 and 90 days, 90 daily history bars and a response time chart.',
          '5 HTTP monitors, checked every 5 minutes. Any 2xx or 3xx answer counts as up.',
          'Telegram and webhook alerts when a monitor goes down.',
          'Uptime badges in classic, status and card styles, light and dark, for your site or README.',
          'The public status page API and the `@logdash/status` client, so you can build the page yourself in your own design.',
          'Logs and metrics from eight SDKs, kept for 24 hours, and one collaborator besides you.',
        ],
      },
      { type: 'heading', text: 'What it does not include' },
      {
        type: 'paragraph',
        text: 'No custom domain on the hosted page: that is Pro, at $15 a month. No push monitors for cron jobs: also Pro. The hosted page carries a Powered by Logdash footer on every plan, and badges carry a small Logdash mark below Pro. There are no email, Slack or SMS alerts and no subscriber notifications on any plan, so customers see an incident only when they open the page.',
      },
      { type: 'heading', text: 'The free API behind the page' },
      {
        type: 'paragraph',
        text: 'The API is not a paid add-on. Every published page, free plan included, is JSON at one public URL with no key:',
      },
      {
        type: 'code',
        language: 'bash',
        code: `curl https://api.logdash.io/v1/status_pages/your-status-page-id`,
      },
      {
        type: 'paragraph',
        text: 'It returns the overall status, each monitor with its status, uptime from 1 hour to 90 days, 90 daily buckets and its last 100 checks. That is enough to render the page inside your own site, styled like the rest of it.',
      },
      { type: 'heading', text: 'Free status page tool comparison' },
      {
        type: 'paragraph',
        text: 'Free tiers as each vendor published them in 2026. Limits move, so check them again before you put a customer-facing URL on one.',
      },
      {
        type: 'list',
        items: [
          'Better Stack: 10 monitors and 10 heartbeats checked every 3 minutes, one status page, email and Slack alerts. Its own docs say the free page can sit on your subdomain.',
          'Atlassian Statuspage: no monitoring at all, 25 components, 100 subscribers, 2 team members, no custom domain. The Hobby plan with a domain is $29 a month.',
        ],
      },
      {
        type: 'comparison',
        title: 'Free plans: Logdash vs Instatus',
        them: 'Instatus',
        rows: [
          {
            feature: 'Monitors',
            logdash: '5 HTTP monitors, every 5 minutes',
            them: '15 monitors, every 2 minutes',
            winner: 'them',
          },
          {
            feature: 'Subscribers',
            logdash: 'None, on any plan',
            them: '200, notified by email',
            winner: 'them',
          },
          {
            feature: 'Hosted page on your domain',
            logdash: 'Paid plans only',
            them: 'Paid plans only',
            winner: 'tie',
          },
          {
            feature: 'Alert channels',
            logdash: 'Telegram and webhook',
            them: 'Email',
            winner: 'tie',
          },
          {
            feature: 'Building your own page',
            logdash:
              'Public JSON API, typed client, React and Svelte component',
            them: 'Their hosted layout',
            winner: 'logdash',
          },
          {
            feature: 'Source code',
            logdash: 'AGPL-3.0, on GitHub',
            them: 'Closed source',
            winner: 'logdash',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'another free tier',
        reasons: [
          'You want more monitors or faster checks for free. Instatus gives 15 at 2 minutes and Better Stack 10 at 3 minutes with a page on your subdomain; Logdash gives 5 at 5 minutes.',
          'Customers expect to subscribe and get emailed. Instatus includes 200 subscribers for free, and Logdash has no subscriber notifications.',
          'You already have monitoring and only need a page plus a subscriber list. That is exactly what the Statuspage free plan is.',
        ],
      },
      { type: 'heading', text: 'Set it up' },
      {
        type: 'steps',
        items: [
          {
            title: 'Add up to 5 monitors',
            text: 'One per app, each pointed at a health URL. Checks run every 5 minutes and store status code and response time.',
          },
          {
            title: 'Publish the page',
            text: 'Pick the monitors, name the page and publish. It goes live on logdash.io straight away, and the API answers for it at the same moment.',
          },
          {
            title: 'Connect Telegram and test',
            text: 'Add a Telegram channel and make one endpoint return a 503. Within one 5-minute check the monitor flips to down, and the page follows within about 3 minutes, by which time the alert is already in Telegram.',
          },
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'Is the Logdash free status page free forever?',
        answer:
          'Yes. The Hobby plan has no trial period and needs no credit card. The limits are 1 status page, 5 HTTP monitors and 5-minute checks.',
      },
      {
        question: 'What is the best free status page tool?',
        answer:
          'Instatus has the most free monitors, 15 at 2-minute checks, plus 200 subscribers. Better Stack is the one with a free page on your own subdomain. Logdash is the pick if you want Telegram alerts and an API you can build your own page on, all free.',
      },
      {
        question: 'Is there open source free status page software?',
        answer:
          'Logdash is AGPL-3.0, and the client and components are MIT. Self-hosting Logdash is not a one-command install yet, so if you want to run everything yourself today, Uptime Kuma is the common choice.',
      },
      {
        question: 'How do I add a free status page for website visitors?',
        answer:
          'Link to the hosted page, add a badge to your footer, or render the component on your own site. The API accepts requests from any origin, so even a static site can show live status.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'free-custom-domain',
    h1: 'Free status page with custom domain',
    answer:
      'The hosted Logdash status page gets your own domain only on the $15 Pro plan, but the status page API is free on every plan, so a page you deploy yourself from the Next.js starter can run on status.yourdomain.com for nothing.',
    meta: {
      title: 'Free status page with custom domain | Logdash',
      description:
        'Custom domains on the hosted Logdash page are Pro only. The free path: the public API plus a Next.js starter on your own subdomain, and who else offers it.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'Straight answer first. On Logdash, a custom domain for the hosted page is a Pro feature at $15 a month. The free Hobby plan publishes the page at `logdash.io/d/<id>`. If a hosted page on your own domain at zero cost is the hard requirement, look at Better Stack: it says its free status page can run on your subdomain.',
      },
      {
        type: 'paragraph',
        text: 'There is a second way that costs nothing. Every published Logdash status page is also public JSON, on every plan, with no key and requests allowed from any origin. A page you build on that API runs on whatever domain you point at it. The data still comes from your Logdash monitors; only the rendering moves to you.',
      },
      {
        type: 'heading',
        text: 'Free status page custom domain with the Next.js starter',
      },
      {
        type: 'paragraph',
        text: 'The starter in `templates/status-page-next` is a complete status page: one Next.js route, one component, Tailwind. It renders on the server, revalidates every 60 seconds and keeps serving the last good page when the API cannot be reached. It is MIT licensed, so change anything you like.',
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
        text: 'Then deploy it and add the domain on your host. The starter README has a Deploy with Vercel button that asks for `LOGDASH_STATUS_PAGE_ID`, and the host shows you the CNAME record to add for `status.yourdomain.com`. The only thing you pay for is the domain, which you already own.',
      },
      { type: 'heading', text: 'The catch with free hosting' },
      {
        type: 'paragraph',
        text: 'Free hosting has terms of its own. Vercel Hobby includes custom domains but is limited to non-commercial, personal use, and a status page for a paying product counts as commercial. The Netlify free plan allows commercial use and custom domains within 300 credits a month, which a page that rarely redeploys should stay inside. Either way, host it apart from your app. A status page on the same servers goes down with the thing it reports on.',
      },
      {
        type: 'heading',
        text: 'Status page custom domain free options compared',
      },
      {
        type: 'list',
        items: [
          'Instatus: free page on an Instatus subdomain only. Your own domain starts at Pro, $20 a month or $15 billed yearly.',
          'Atlassian Statuspage: no custom domain on the free plan. Hobby, the first plan with one, is $29 a month.',
          'Uptime Kuma: free on any domain, on a server you run and keep online yourself.',
        ],
      },
      {
        type: 'comparison',
        title: 'Your own domain: Logdash vs Better Stack',
        them: 'Better Stack',
        rows: [
          {
            feature: 'Hosted page on your domain',
            logdash: 'Pro, $15 a month',
            them: 'Free plan, on a subdomain',
            winner: 'them',
          },
          {
            feature: 'Own build on your domain',
            logdash: 'Free: public API, MIT client, component and starter',
            them: 'Public JSON, no official client or component',
            winner: 'logdash',
          },
          {
            feature: 'Design control',
            logdash: 'All of it, the code is yours',
            them: 'Their layout, custom CSS is $15 a month per page',
            winner: 'logdash',
          },
          {
            feature: 'Work to set up',
            logdash: 'Deploy a Next.js app, add a CNAME',
            them: 'Type the domain, add a CNAME',
            winner: 'them',
          },
          {
            feature: 'Free monitors',
            logdash: '5, every 5 minutes',
            them: '10, every 3 minutes',
            winner: 'them',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Better Stack',
        reasons: [
          'You want a hosted page on your own domain for free and do not want to deploy anything.',
          'You need more than 5 monitors or checks faster than every 5 minutes without paying.',
        ],
      },
      { type: 'heading', text: 'From monitor to your domain' },
      {
        type: 'steps',
        items: [
          {
            title: 'Publish the page in Logdash',
            text: 'Add your monitors to a status page, publish it and copy its id from the Build your own section.',
          },
          {
            title: 'Deploy the starter on your domain',
            text: 'Deploy with LOGDASH_STATUS_PAGE_ID set, then point status.yourdomain.com at the host with the CNAME record it gives you.',
          },
          {
            title: 'Take a monitor down',
            text: 'Return a 503 from one health endpoint. The monitor flips to down on its next check, your page on your own domain shows the outage a few minutes later, and the Telegram alert reaches you before any visitor does.',
          },
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'Does Logdash offer a free status page with custom domain?',
        answer:
          'Not for the hosted page, which needs Pro at $15 a month. A page you build on the free public API, such as the Next.js starter, can run on your own domain on the free plan.',
      },
      {
        question: 'Which tools give a free status page custom domain?',
        answer:
          'Better Stack says its free status page can use your subdomain. Instatus and Atlassian Statuspage keep custom domains on paid plans. Self-hosted tools like Uptime Kuma work on any domain if you run the server.',
      },
      {
        question:
          'Is the status page custom domain free if I build my own page?',
        answer:
          'On the Logdash side, yes: the API, the client and the starter cost nothing on any plan. You pay for hosting only if your host charges, and Vercel Hobby rules out commercial use.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'custom',
    h1: 'Custom status page',
    answer:
      'Logdash gives you two kinds of custom status page: the hosted page on your own subdomain through one CNAME to statuspage.logdash.io on Pro, or a page you build yourself on the public API, on any domain and any plan.',
    meta: {
      title: 'Custom status page: your domain or your build | Logdash',
      description:
        'Put a hosted status page on status.yourdomain.com with one CNAME, or build your own on the public API. The DNS record, the Cloudflare catch, and the trade-offs.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: '"Custom" means one of two things. Either the page lives on your domain, so customers see status.yourapp.com instead of a vendor URL. Or the page looks like your product, in your fonts and colours. Logdash does both, by two different routes: the domain on Pro, the design on every plan.',
      },
      { type: 'heading', text: 'Status page custom domain: the hosted route' },
      {
        type: 'paragraph',
        text: 'On Pro, open the status page in Logdash, enter a subdomain such as `status.example.com` and add one DNS record. Logdash looks for it every 5 seconds. Once the CNAME points at `statuspage.logdash.io`, the domain is verified, the page is served there over HTTPS, and the status page API accepts the domain in place of the id.',
      },
      {
        type: 'code',
        language: 'bash',
        code: `# The record, in any DNS provider
# Type   Name     Target
# CNAME  status   statuspage.logdash.io

# Check it from your machine before Logdash does
dig +short CNAME status.example.com
# statuspage.logdash.io.`,
      },
      {
        type: 'paragraph',
        text: 'Verification gives up after 60 attempts, about 5 minutes. If the record was not there in time, the domain is marked failed: fix the DNS, delete the domain and add it again. On the hosted page you choose its name and which monitors it shows. Fonts, colours and layout are fixed.',
      },
      { type: 'heading', text: 'Cloudflare custom status page' },
      {
        type: 'paragraph',
        text: 'If your DNS is on Cloudflare, create the record as DNS only, the grey cloud. A proxied record answers with Cloudflare IP addresses, so the CNAME lookup never sees `statuspage.logdash.io` and verification fails. Paid zones can also flatten every CNAME, so check that setting is off. If you would rather build the page on Cloudflare itself, cf-workers-status-page is the known open source option, though it has not had a commit in about three years.',
      },
      { type: 'heading', text: 'Custom design: the build-your-own route' },
      {
        type: 'paragraph',
        text: 'Every published page is also JSON at the public status page API, with no key, on every plan. The quickest way to render it is the shadcn component, which takes your Tailwind theme through the shadcn CSS variables:',
      },
      {
        type: 'code',
        language: 'bash',
        code: `npx shadcn add https://logdash.io/r/react/status-page.json`,
      },
      {
        type: 'paragraph',
        text: 'Deploy the result anywhere, on any domain. Logdash never needs to know which one, so this is also the way to a custom domain without Pro. For a complete site, the Next.js starter deploys to Vercel in one click. Either way, host it apart from your app: a page that shares servers or DNS with the app goes down with it.',
      },
      { type: 'heading', text: 'Which route to pick' },
      {
        type: 'paragraph',
        text: 'Pick the hosted route when the page just needs to exist and you are already on Pro: one record, nothing to deploy, nothing to update. Pick your own build when the page is part of your brand, when you want status inside your app, or when you are on the free or Builder plan. Both read the same checks, so you can start hosted and move to your own build later without losing a day of history.',
      },
      {
        type: 'comparison',
        title: 'Logdash vs Uptime Kuma',
        them: 'Uptime Kuma',
        rows: [
          {
            feature: 'Your own domain',
            logdash: 'Pro plan, one CNAME',
            them: 'Free, through your reverse proxy',
            winner: 'them',
          },
          {
            feature: 'HTTPS on that domain',
            logdash: 'Handled by Logdash',
            them: 'Your reverse proxy and certificate',
            winner: 'logdash',
          },
          {
            feature: 'Custom design',
            logdash: 'Any design through the API, component or starter',
            them: 'Custom CSS on the Kuma layout',
            winner: 'logdash',
          },
          {
            feature: 'Incidents and maintenance',
            logdash: 'None',
            them: 'Both built in',
            winner: 'them',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Uptime Kuma',
        reasons: [
          'You want the hosted page on your own domain for free and already run a reverse proxy.',
          'You post incidents and maintenance notices. Logdash pages show checks only.',
          'Monitoring has to stay inside your own network.',
        ],
      },
      { type: 'heading', text: 'Set it up' },
      {
        type: 'steps',
        items: [
          {
            title: 'Pick a route',
            text: 'Hosted page on Pro with one CNAME, or your own build on any plan, including the free one.',
          },
          {
            title: 'Point DNS',
            text: 'CNAME the subdomain to statuspage.logdash.io, DNS only on Cloudflare, or to wherever you deployed your own build.',
          },
          {
            title: 'Test the alert',
            text: 'Connect Telegram, then stop one monitored service. Your status subdomain shows it within a few minutes, but the Telegram alert reaches you first, with the monitor name and status code.',
          },
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'What is a custom status page?',
        answer:
          'A status page on your own domain, in your own design, or both. Logdash covers the domain with a CNAME on Pro, and the design with a public API, an MIT component and a Next.js starter on any plan.',
      },
      {
        question: 'How do I set up a status page custom domain?',
        answer:
          'On Pro, enter the subdomain on the status page in Logdash, then add a CNAME from it to statuspage.logdash.io. Logdash checks every 5 seconds for about 5 minutes and serves the page over HTTPS once the record resolves. If it fails, fix the record, delete the domain and add it again.',
      },
      {
        question: 'How do I make a Cloudflare custom status page work?',
        answer:
          'Set the CNAME to DNS only, the grey cloud, and make sure CNAME flattening is off for it. With the orange cloud on, Cloudflare answers with its own IP addresses and the CNAME check fails.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'template',
    h1: 'Status page template',
    answer:
      'The Logdash Next.js starter is a status page template you deploy to Vercel in one click: paste a status page id and it serves live uptime for your monitors, rendered on the server and refreshed every 60 seconds.',
    meta: {
      title: 'Status page template: Next.js, one-click Vercel | Logdash',
      description:
        'An MIT Next.js status page template with a one-click Vercel deploy, a one-file HTML version you can paste, and how it compares to Upptime and Uptime Kuma themes.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'Most status page templates are a static mockup with three green rows and a made-up 99.99%. The design was never the hard part. The data is: something has to check your endpoints from outside your network every few minutes, keep 90 days of history and stay up through the outage the page exists to announce. A template without that is a screenshot.',
      },
      {
        type: 'paragraph',
        text: 'The Logdash starter works the other way round. Logdash runs the checks and keeps 90 days of history. The template is a small Next.js app, one page and one component, that renders that data in your design.',
      },
      { type: 'heading', text: 'Deploy the Next.js status page template' },
      {
        type: 'paragraph',
        text: 'The starter README has a Deploy with Vercel button. It clones the template into your own repository and asks for one variable, `LOGDASH_STATUS_PAGE_ID`. To try it locally first:',
      },
      {
        type: 'code',
        language: 'bash',
        title: 'Run it locally',
        code: `npx create-next-app@latest status-page \\
  --example https://github.com/logdash-io/logdash.io \\
  --example-path templates/status-page-next
cd status-page
# Logdash's own page, so it runs as pasted. Swap in your id later.
echo "LOGDASH_STATUS_PAGE_ID=status.logdash.io" > .env.local
npm run dev`,
      },
      {
        type: 'paragraph',
        text: 'The id is the last part of your status page URL in Logdash, or its verified custom domain. The page is fetched on the server and rendered again at most once a minute, so it arrives complete in the HTML and crawlers see real status rather than a spinner. `next build` fetches once, so a wrong id fails the build instead of shipping a broken page.',
      },
      {
        type: 'list',
        items: [
          'An overall banner: all systems operational, partial outage or major outage.',
          'A row per monitor with its uptime over 24 hours, 7, 30 and 90 days.',
          'Ninety daily bars per monitor, each with a tooltip showing that UTC day, its uptime and its checks.',
          'The last data it had when the Logdash API cannot be reached, never a blank page.',
        ],
      },
      {
        type: 'paragraph',
        text: 'Colours come from the shadcn CSS variables in `app/globals.css`. Replace them with your site theme and it stops looking like a template. Deploy it as its own Vercel project on a subdomain such as `status.example.com`, apart from your app, so one outage cannot take both down.',
      },
      { type: 'heading', text: 'Status page HTML template' },
      {
        type: 'paragraph',
        text: 'No framework, no build step. The API accepts requests from any origin, so one file is enough, even opened straight from disk.',
      },
      {
        type: 'code',
        language: 'html',
        title: 'index.html',
        code: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Status</title>
  </head>
  <body>
    <h1 id="name">Status</h1>
    <p id="overall"></p>
    <ul id="monitors"></ul>

    <script type="module">
      // Your status page id, or its verified custom domain.
      const id = 'status.logdash.io';
      const res = await fetch(\`https://api.logdash.io/v1/status_pages/\${id}\`);
      const page = await res.json();

      document.title = page.name;
      document.getElementById('name').textContent = page.name;
      document.getElementById('overall').textContent = page.status;
      document.getElementById('monitors').replaceChildren(
        ...page.monitors.map((monitor) => {
          const li = document.createElement('li');
          const uptime = monitor.uptime['90d']?.toFixed(2) ?? '-';
          li.textContent = \`\${monitor.name}: \${monitor.status}, \${uptime}% over 90 days\`;
          return li;
        }),
      );
    </script>
  </body>
</html>`,
      },
      {
        type: 'paragraph',
        text: 'It prints the page name, the overall status and one line per monitor with its 90-day uptime. It fetches once per load and draws no history bars. For bars, read `history.daily`, which always holds 90 UTC days, and format those dates in UTC too, or a visitor west of Greenwich sees every bar labelled a day early.',
      },
      {
        type: 'heading',
        text: 'Status page template on GitHub: Logdash vs Upptime',
      },
      {
        type: 'comparison',
        title: 'Logdash starter vs Upptime',
        them: 'Upptime',
        rows: [
          {
            feature: 'What you copy',
            logdash: 'A Next.js app, MIT',
            them: 'A GitHub template repository, MIT',
            winner: 'tie',
          },
          {
            feature: 'Check interval',
            logdash: '5 minutes free, 1 minute Builder, 15 seconds Pro',
            them: 'At most every 5 minutes, on GitHub Actions',
            winner: 'logdash',
          },
          {
            feature: 'Accounts needed',
            logdash: 'Logdash, plus Vercel or any Node host',
            them: 'GitHub only',
            winner: 'them',
          },
          {
            feature: 'Incidents',
            logdash: 'None',
            them: 'GitHub Issues, opened and closed for you',
            winner: 'them',
          },
          {
            feature: 'Page design',
            logdash: 'One React component you edit',
            them: 'Settings in a YAML config',
            winner: 'logdash',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Upptime',
        reasons: [
          'You want everything inside one GitHub organisation, with no other account anywhere.',
          'Five-minute checks are enough and you like incidents as GitHub Issues.',
          'Your code already lives on GitHub and you want the status page to cost nothing extra.',
        ],
      },
      { type: 'heading', text: 'Uptime Kuma status page template' },
      {
        type: 'paragraph',
        text: 'Kuma has no template system. Each status page has a Custom CSS field, and community themes on GitHub restyle it. Past CSS, its status page endpoints return JSON you could feed into the HTML file above, though Kuma documents them as internal and unsupported for third parties.',
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Publish a status page',
            text: 'Add your monitors to a status page in Logdash, publish it and copy its id.',
          },
          {
            title: 'Deploy the template',
            text: 'Click Deploy with Vercel in the starter README, paste the id into LOGDASH_STATUS_PAGE_ID and point a status subdomain at the new project.',
          },
          {
            title: 'Watch it go red',
            text: 'Connect Telegram and stop one service. The row on your page turns red within about three minutes, but the Telegram alert gets to you first, with the monitor name and status code.',
          },
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'Is there a status page HTML template?',
        answer:
          'Yes, the single file on this page. Paste it, change the id and open it in a browser. It reads the public API, so it shows live data with no build step. It refreshes on reload only, so wrap the fetch in a 60-second interval if it stays open on a wall screen.',
      },
      {
        question: 'Is there an Uptime Kuma status page template?',
        answer:
          'Not built in. Kuma gives each status page a Custom CSS field, and GitHub has community themes such as cute-kuma and uptime-kuma-themes to paste into it. The layout stays Kuma, only the styling changes.',
      },
      {
        question: 'Where can I find a status page template on GitHub?',
        answer:
          'The Logdash starter lives in templates/status-page-next of logdash-io/logdash.io, MIT licensed. Upptime is a GitHub template repository you copy with Use this template. The awesome-status-pages list collects many more.',
      },
      {
        question: 'Is there a Next.js status page template?',
        answer:
          'Yes, this one: Next.js 16, React 19 and Tailwind 4, one page and one component. It renders on the server with revalidate set to 60 and polls in the browser. The component is the same file the shadcn command installs, so it moves into an existing Next.js app unchanged.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'react',
    h1: 'React status page',
    answer:
      'Install the Logdash status page component with one shadcn command, pass it your status page id, and your React or Next.js app renders live status, uptime per monitor and 90 days of history in your own Tailwind theme.',
    meta: {
      title: 'React status page component for Next.js | Logdash',
      description:
        'A copy-paste React status page: one shadcn command, your Tailwind theme, server rendering in Next.js, a Vercel starter, and the same component for Svelte.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'A status page in React is two problems: getting the data and drawing it. Logdash answers the first with a public JSON endpoint for every published status page, no API key needed, and the second with a component you copy into your repo. The file is yours. It is plain React and Tailwind with one dependency, `@logdash/status`, a typed client with zero runtime dependencies that polls every 60 seconds, pauses in hidden tabs and keeps the last good data when a request fails.',
      },
      { type: 'heading', text: 'shadcn status page' },
      {
        type: 'paragraph',
        text: 'The component ships as a shadcn registry item, so it installs the same way a Button does, into any project that has already run shadcn init.',
      },
      {
        type: 'code',
        language: 'bash',
        code: `npx shadcn add https://logdash.io/r/react/status-page.json`,
      },
      {
        type: 'paragraph',
        text: 'That writes `components/status-page.tsx` and installs `@logdash/status`. The file renders an overall banner, one row per monitor with its uptime, and 90 daily bars with a tooltip. `StatusBanner`, `MonitorRow` and `DailyBars` are exported on their own too, so a footer can show the one-line banner and skip the rest.',
      },
      { type: 'heading', text: 'Next.js status page' },
      {
        type: 'paragraph',
        text: 'Fetch on the server and pass the result as `initialData`. The HTML arrives with real status in it, so crawlers and visitors without JavaScript see the same page, and the client takes over polling with no loading flash.',
      },
      {
        type: 'code',
        language: 'typescript',
        title: 'app/status/page.tsx',
        code: `import { fetchStatusPage } from '@logdash/status';
import { StatusPage } from '@/components/status-page';

export const revalidate = 60;

export default async function Page() {
  const page = await fetchStatusPage('your-status-page-id');

  return <StatusPage statusPageId="your-status-page-id" initialData={page} />;
}`,
      },
      {
        type: 'paragraph',
        text: 'The API caches every page for 60 seconds, so a `revalidate` below 60 buys nothing. A bad id fails the build instead of shipping an empty page: 404 means no page has that id, 403 means it is not published yet.',
      },
      { type: 'heading', text: 'Tailwind status page' },
      {
        type: 'paragraph',
        text: 'There is no stylesheet to fight. The component uses the shadcn CSS variables, such as `text-foreground`, `text-muted-foreground` and `border-border`, so it takes your colours, fonts and dark mode from the theme you already have. Only the three status colours, green, amber and red, are written into the file, and each is one edit away.',
      },
      { type: 'heading', text: 'Status page on Vercel' },
      {
        type: 'paragraph',
        text: 'If you want the page as its own site rather than a route in your app, the Next.js starter in `templates/status-page-next` is this component plus one page. Its README has a Deploy with Vercel button that asks for one variable, `LOGDASH_STATUS_PAGE_ID`. Give it its own project and subdomain: a status page that deploys with your app goes down with your app.',
      },
      { type: 'heading', text: 'Svelte status page' },
      {
        type: 'paragraph',
        text: 'The same component exists for Svelte 5 through shadcn-svelte, with the same props, the same theme variables and the same 90 days of bars.',
      },
      {
        type: 'code',
        language: 'bash',
        code: `npx shadcn-svelte add https://logdash.io/r/svelte/status-page.json`,
      },
      { type: 'heading', text: 'Your component or the hosted page' },
      {
        type: 'comparison',
        title: 'Component in your app vs hosted Logdash page',
        them: 'Hosted page',
        rows: [
          {
            feature: 'Setup',
            logdash: 'One shadcn command and a route',
            them: 'Publish in Logdash, no code',
            winner: 'them',
          },
          {
            feature: 'Look',
            logdash: 'Your fonts, colours and layout',
            them: 'Logdash design with your monitors',
            winner: 'logdash',
          },
          {
            feature: 'Your own domain',
            logdash: 'Any domain, on any plan',
            them: 'Pro plan',
            winner: 'logdash',
          },
          {
            feature: 'Stays up when your app is down',
            logdash: 'Only if you host it apart from the app',
            them: 'Runs on Logdash, apart from your app',
            winner: 'them',
          },
          {
            feature: 'Upgrades',
            logdash: 'You own the file and its changes',
            them: 'Logdash ships them',
            winner: 'them',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'the hosted page',
        reasons: [
          'You have no React or Svelte site to put it in, and a logdash.io link is enough for your customers.',
          'You would rather not own the deploy. A page you host is one more thing that can break during the incident it is meant to report.',
        ],
      },
      { type: 'heading', text: 'Put a monitor behind it' },
      {
        type: 'steps',
        items: [
          {
            title: 'Add a monitor',
            text: 'Point an HTTP monitor at your health endpoint. Logdash checks it every 5 minutes on the free plan, every minute on Builder and every 15 seconds on Pro, and stores status code and response time.',
          },
          {
            title: 'Publish the status page',
            text: 'Add the monitor to a status page, publish it and copy the id from the Build your own section. That id is the only prop the component needs.',
          },
          {
            title: 'Break it on purpose',
            text: 'Return a 503 from the health endpoint. The next check flips the monitor to down, the component shows it on its next poll, and a Telegram alert reaches your phone.',
          },
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'How do I add a nextjs status page to an existing app?',
        answer:
          'Run the shadcn command, add a route such as app/status/page.tsx that calls fetchStatusPage on the server, and render the StatusPage component with initialData. Set revalidate to 60, which matches the API cache.',
      },
      {
        question: 'Is there a shadcn status page component?',
        answer:
          'Yes. npx shadcn add https://logdash.io/r/react/status-page.json copies one file into your components folder. Its only dependency is @logdash/status, and the file is yours to edit.',
      },
      {
        question: 'Does the tailwind status page follow my theme?',
        answer:
          'Yes. It reads the shadcn CSS variables, so background, text, borders and dark mode come from your theme. The green, amber and red status colours are set in the component itself.',
      },
      {
        question: 'Can I deploy the status page on Vercel?',
        answer:
          'Yes. The Next.js starter has a Deploy with Vercel button and needs one environment variable, LOGDASH_STATUS_PAGE_ID. Vercel Hobby is for non-commercial use only, so a page for a paying product belongs on a paid Vercel plan or another host.',
      },
      {
        question: 'Is there a svelte status page component?',
        answer:
          'Yes, for Svelte 5: npx shadcn-svelte add https://logdash.io/r/svelte/status-page.json. In SvelteKit, fetch the page in a load function and pass it as initialData for server rendering.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'embed',
    h1: 'Status page embed',
    answer:
      'Embed a Logdash status page by dropping a copy-paste component into your site, which renders live status and 90 days of history from a public JSON API, or by adding SVG uptime badges anywhere an image tag works.',
    meta: {
      title: 'Status page embed: widget and uptime badges | Logdash',
      description:
        'Embed live status in your website: a React or Svelte widget on a public JSON API, or SVG badges in classic, status and card styles, light or dark.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: "The obvious way to embed a status page is an iframe, and it is the one way that does not work here. The hosted Logdash page sends `frame-ancestors 'none'`, because a page that can be framed can be used for clickjacking. Uptime Kuma blocks framing from other domains too until you set `UPTIME_KUMA_DISABLE_FRAME_SAMEORIGIN=true`, and its docs say that block is what stops the page being used for phishing. So skip the frame and embed the data.",
      },
      { type: 'heading', text: 'Status page widget' },
      {
        type: 'paragraph',
        text: 'The widget is a component that lives in your codebase. Install it with shadcn and it renders the overall status, one row per monitor and 90 daily bars, styled by your Tailwind theme so it matches the page around it.',
      },
      {
        type: 'code',
        language: 'bash',
        code: `# React
npx shadcn add https://logdash.io/r/react/status-page.json

# Svelte
npx shadcn-svelte add https://logdash.io/r/svelte/status-page.json`,
      },
      {
        type: 'paragraph',
        text: 'The data comes from `https://api.logdash.io/v1/status_pages/<id>`, which needs no key and answers requests from any origin, so the widget runs fine on a static site. Responses are cached for 60 seconds and the client polls once a minute, pausing while the tab is hidden. If a request fails, the widget keeps the last good data instead of going blank.',
      },
      {
        type: 'heading',
        text: 'Embed status page in website pages with a badge',
      },
      {
        type: 'paragraph',
        text: 'A badge is an SVG, so it goes wherever an image goes: a marketing footer, a docs sidebar, a GitHub README. Every monitor on a published status page has a badge key, and the badge picker in the status page settings puts it into a ready snippet for you. This component swaps light and dark with the visitor system theme; in plain HTML the markup is the same with `srcset` instead of `srcSet`.',
      },
      {
        type: 'code',
        language: 'typescript',
        title: 'status-badge.tsx',
        code: `const badge =
  'https://api.logdash.io/public_dashboards/your-status-page-id/badges/your-badge-key.svg';

export function StatusBadge() {
  return (
    <a href="https://logdash.io/d/your-status-page-id">
      <picture>
        <source
          media="(prefers-color-scheme: dark)"
          srcSet={badge + '?style=card&theme=dark'}
        />
        <img alt="API status" src={badge + '?style=card&theme=light'} />
      </picture>
    </a>
  );
}`,
      },
      {
        type: 'list',
        items: [
          '`style=classic` reads uptime 30d and a percentage, the shields.io shape READMEs expect. `period` sets the window: `24h`, `7d`, `30d` (the default) or `90d`. It has one colour scheme, so `theme` does nothing.',
          '`style=status` shows the monitor name and its state: Operational, Degraded, Down or Unknown. It takes `theme=light` or `theme=dark`.',
          '`style=card` shows name, uptime and 90 daily bars in a 120 pixel tall card. It takes `theme`, and its window is always 90 days.',
        ],
      },
      {
        type: 'paragraph',
        text: 'Badges are cached for 60 seconds. Below Pro they carry a small Logdash mark; on Pro, the plan that also gets custom domains, the mark is gone.',
      },
      { type: 'heading', text: 'Uptime Kuma embed status page options' },
      {
        type: 'paragraph',
        text: 'Uptime Kuma is the usual free answer, and its embed story is close to this one: badges for status, uptime, ping, response time and certificate expiry, for any monitor on a published status page. The difference is who runs it. Kuma serves its badges from your own server, so when that box goes down the badge breaks with it.',
      },
      {
        type: 'comparison',
        title: 'Embedding: Logdash vs Uptime Kuma',
        them: 'Uptime Kuma',
        rows: [
          {
            feature: 'Iframe the whole page',
            logdash: 'Blocked',
            them: 'Allowed after one env var that turns off a protection',
            winner: 'them',
          },
          {
            feature: 'Widget for your own pages',
            logdash: 'React and Svelte component on a public JSON API',
            them: 'Internal API, not supported for third parties',
            winner: 'logdash',
          },
          {
            feature: 'Badge types',
            logdash: 'Uptime, current status, 90-day card',
            them: 'Status, uptime, ping, response time, cert expiry',
            winner: 'them',
          },
          {
            feature: 'Who keeps badges online',
            logdash: 'Logdash',
            them: 'Your server',
            winner: 'logdash',
          },
          {
            feature: 'Free monitors',
            logdash: '5, checked every 5 minutes',
            them: 'As many as your server holds',
            winner: 'them',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Uptime Kuma',
        reasons: [
          'You already run a server and want unlimited monitors for the price of that server. The Logdash free plan stops at 5.',
          'You need a certificate expiry or ping badge. Logdash checks HTTP status and response time only.',
          'You want the whole page framed as it is and accept turning off that protection.',
        ],
      },
      { type: 'heading', text: 'From monitor to embed' },
      {
        type: 'steps',
        items: [
          {
            title: 'Monitor the endpoint',
            text: 'Add an HTTP monitor for the URL your visitors depend on. On the free plan it is checked every 5 minutes, with status code and response time stored.',
          },
          {
            title: 'Publish and embed',
            text: 'Add the monitor to a status page and publish it, then copy the badge snippet or the status page id for the widget.',
          },
          {
            title: 'Test the alert',
            text: 'Make the endpoint return a 503. The monitor goes down on the next check, the status badge reads Down within about 2 minutes, once its caches expire, and by then the Telegram alert is already on your phone.',
          },
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'Can I embed status page in website pages with an iframe?',
        answer:
          "Not the hosted Logdash page. It sends frame-ancestors 'none' to block clickjacking. Use the component, which renders the same data inside your own markup, or a badge image.",
      },
      {
        question: 'Is there a status page widget for React and Svelte?',
        answer:
          'Yes. One shadcn or shadcn-svelte command copies a status page component into your project. It polls the public API once a minute and uses your Tailwind theme.',
      },
      {
        question:
          'Does the Uptime Kuma embed status page option need an iframe?',
        answer:
          'For the full page, yes, and only after you set UPTIME_KUMA_DISABLE_FRAME_SAMEORIGIN=true. Otherwise Kuma offers badges for monitors on a published status page, served from your own server.',
      },
      {
        question: 'Which status page embed works in a GitHub README?',
        answer:
          'A badge. GitHub renders SVG images and supports the picture tag with prefers-color-scheme, so the light and dark snippet from the badge picker works as pasted.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'examples',
    h1: 'Status page examples',
    answer:
      'The status pages worth copying are GitHub for incident updates, Vercel for per-region components, Stripe for a short component list, Linear for showing an unflattering number and Cloudflare for maintenance notices.',
    meta: {
      title: 'Status page examples worth copying | Logdash',
      description:
        'GitHub, Vercel, Stripe, Linear and Cloudflare status pages, checked in October 2026: what each does well, what a small SaaS should copy and what to skip.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'Every page below was checked on 2 October 2026. All five run on a hosted tool: GitHub, Vercel, Stripe and Cloudflare on Atlassian Statuspage, Linear on incident.io. Even Stripe retired its custom-built status.stripe.com, which now redirects to Statuspage. The tool matters less than three decisions: what counts as a component, how often someone posts during an incident, and how honest the numbers are.',
      },
      { type: 'heading', text: 'Best status page examples' },
      {
        type: 'list',
        items: [
          'GitHub, githubstatus.com. 11 components named after what users touch: Git Operations, Webhooks, API Requests, Actions, Copilot. On 1 October 2026 an Actions incident got 10 timestamped updates in 3 hours 9 minutes, closing with a promise of a root cause analysis. Fixes that happened before anyone posted are logged as retroactive incidents rather than left out.',
          'Vercel, vercel-status.com. 67 components, 20 of them CDN regions named by code and city, from ARN1 Stockholm to YUL1 Montréal, so a customer can check their own region. Its 28 September incident states the exact window, 13:01 to 13:11 UTC, and who was hit: functions on the Edge runtime.',
          'Stripe, stripestatus.com. Short for a company its size: 6 components named after product areas, from Stripe API to Acquirers and payment methods, each with 90 days of bars. Maintenance is announced per payment method, such as TWINT or BLIK, and there is an Atom feed for anyone who wants updates without an account.',
          'Linear, linearstatus.com. 6 components: application, API and integrations, each split into US and EU. It shows the EU application at 99.54% next to 100% for the API, which is why the 100% is believable.',
          'Cloudflare, cloudflarestatus.com. 479 components, mostly data centres grouped into 7 regions. On 2 October it listed 25 upcoming maintenance windows by city, such as NRT Tokyo.',
        ],
      },
      { type: 'heading', text: 'SaaS status page examples for a small team' },
      {
        type: 'paragraph',
        text: 'Copy Linear and Stripe, not Cloudflare. A small SaaS has 3 to 6 things a customer can tell apart: the app, the API, webhooks, maybe sign-in. Name them that way. 479 components is right for a global network and noise for a product with one database. Steal GitHub and Vercel habits instead: post fast, timestamp everything, name the UTC window when it is over.',
      },
      { type: 'heading', text: 'Status page design examples' },
      {
        type: 'paragraph',
        text: 'Nearly every page above shares one layout: an overall status line, a row per component, a strip of daily bars and an uptime percentage. Linear and Statuspage pages show 90 days of history, and the Logdash component draws the same layout from your monitors, styled with your Tailwind theme. Every Statuspage page also serves its state as JSON, and so does every published Logdash page:',
      },
      {
        type: 'code',
        language: 'bash',
        code: `# GitHub, on Atlassian Statuspage
curl -s https://www.githubstatus.com/api/v2/summary.json | jq -r '.status.description'

# Logdash's own status page, by its custom domain
curl -s https://api.logdash.io/v1/status_pages/status.logdash.io | jq -r '.status'`,
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Monitor what you will list',
            text: 'Add one Logdash HTTP monitor per component you plan to show, and point it at a health URL.',
          },
          {
            title: 'Publish the page',
            text: 'Add the monitors to a status page and publish it, or render it in your own design with the shadcn component or the Next.js starter.',
          },
          {
            title: 'Test the alert',
            text: 'Stop one service. On the next check the row turns red, and before a customer opens the page a Telegram alert reaches you with the monitor name and status code.',
          },
        ],
      },
      {
        type: 'comparison',
        title: 'Logdash vs Atlassian Statuspage',
        them: 'Statuspage',
        rows: [
          {
            feature: 'Incident posts and subscribers',
            logdash: 'Not built in',
            them: 'Email, SMS, Slack, webhook and RSS',
            winner: 'them',
          },
          {
            feature: 'Status from real checks',
            logdash: 'Built in, every 5 minutes on the free plan',
            them: 'Needs a monitoring tool, the API or email automation',
            winner: 'logdash',
          },
          {
            feature: 'Public JSON',
            logdash: 'Yes, no key',
            them: 'Yes, no key',
            winner: 'tie',
          },
          {
            feature: 'Custom domain',
            logdash: 'Pro, or any plan with your own build',
            them: 'Paid plans, from $29 a month',
            winner: 'tie',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Statuspage',
        reasons: [
          'You want the GitHub setup: written incident updates and subscribers by email, SMS or Slack.',
          'You want the Stripe setup: maintenance windows announced ahead of time, per component.',
          'Your checks already run in another tool and only the page and the subscriber list are missing.',
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'What are the best status page examples?',
        answer:
          'GitHub for incident updates, Vercel for regional components, Stripe for a short component list, Linear for honest numbers. All four were live on 2 October 2026.',
      },
      {
        question: 'What are good SaaS status page examples for a small team?',
        answer:
          'Linear and Stripe. Both list 6 components or fewer, named the way customers think about the product. Cloudflare is a good page for a global network and a poor template for a product with one database.',
      },
      {
        question: 'Where can I find status page design examples?',
        answer:
          'Open any of the five pages above. Most share one layout: overall status, a row per component, daily history bars and an uptime figure. The Logdash component gives you that layout in your own theme.',
      },
      {
        question: 'Do status page examples like GitHub use a hosted tool?',
        answer:
          'Yes. GitHub, Vercel, Stripe and Cloudflare run on Atlassian Statuspage and Linear on incident.io. Hosted tools win on incident posts and subscribers, building your own wins on design.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'best-practices',
    h1: 'Status page best practices',
    answer:
      'Host the status page apart from your app, drive it from real checks, list only what customers can tell apart, show uptime over a stated window rounded down, and post a timestamped update at least every hour during an incident.',
    meta: {
      title: 'Status page best practices | Logdash',
      description:
        'Where to host a status page, what to put on it, how to show uptime percentages honestly and how often to post during an incident, with numbers from GitHub and Vercel.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'A status page has one job: answer "is it you or me" at the exact moment your app is broken. Every rule below follows from that moment.',
      },
      { type: 'heading', text: 'Host it apart from your app' },
      {
        type: 'paragraph',
        text: 'People open a status page when your app is down, and a page that shares its servers, deploys or DNS setup with your app goes down with it. Give it its own project and its own subdomain. The same goes for the checks behind it: a monitor running on the box it watches goes quiet exactly when you need it.',
      },
      { type: 'heading', text: 'What to put on a status page' },
      {
        type: 'list',
        items: [
          'One overall status at the top, in words: operational, degraded or outage.',
          'A row per thing customers can tell apart: app, API, webhooks, sign-in. Not postgres-primary-2. GitHub gets by with 11 rows.',
          '90 days of daily history. Long enough to show a pattern, short enough to stay current.',
          'When the data was last updated. A visitor needs to know whether "operational" is 1 minute old or 1 hour old.',
          'A way to follow along: an RSS or Atom feed, a subscribe button, or an email address, as Linear has.',
        ],
      },
      { type: 'heading', text: 'Status page uptime percentage' },
      {
        type: 'paragraph',
        text: 'State the window and say what counts as down. 90 days is the convention. At 99.9% over 90 days you may be down about 2 hours and 10 minutes; at 99.99%, about 13 minutes. Round down, never up: 99.996% shown as 100% claims a perfect quarter you did not have. Definitions differ too. incident.io counts degraded performance as up. Logdash counts a check as up only on a 2xx or 3xx answer, so the figure is successful checks over total checks.',
      },
      {
        type: 'paragraph',
        text: 'The Logdash status page API returns raw values such as 99.98835. This prints each monitor rounded down to two decimals, and works as pasted against our own page:',
      },
      {
        type: 'code',
        language: 'bash',
        code: `curl -s https://api.logdash.io/v1/status_pages/status.logdash.io | jq -r '
  .monitors[]
  | .uptime["90d"] as $u
  | "\\(.name): \\(if $u == null then "no data" else "\\(($u * 100 | floor) / 100)%" end)"'`,
      },
      {
        type: 'paragraph',
        text: 'Show the unflattering number. On 2 October 2026 Linear showed its EU application at 99.54% beside 100% for its API, and that is what makes the 100% believable.',
      },
      { type: 'heading', text: 'Status page incident communication' },
      {
        type: 'list',
        items: [
          'Post within minutes, before you know the cause. Say what is affected, not why.',
          'Update at least every hour, even with nothing new. On 1 October 2026 GitHub posted 10 updates in 3 hours 9 minutes during an Actions incident.',
          'Close with the exact window in UTC and who was hit. Vercel wrote "between 13:01 and 13:11 UTC" and named the Edge runtime.',
          'Promise a root cause write-up and publish it.',
        ],
      },
      {
        type: 'paragraph',
        text: 'Logdash status pages show what the checks see. They have no incident editor and no subscriber list, so incident posts go wherever your customers already read you. The full status page reference is at /docs/status-pages.',
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Monitor each component',
            text: 'Add a Logdash HTTP monitor per row you plan to show and point it at a health URL.',
          },
          {
            title: 'Publish on its own host',
            text: 'Publish the hosted page, or deploy the Next.js starter as its own project on status.yourdomain.com.',
          },
          {
            title: 'Hear it first',
            text: 'Stop one service. On the next check the row turns red, and before anyone opens the page a Telegram alert reaches you with the status code.',
          },
        ],
      },
      {
        type: 'comparison',
        title: 'Logdash vs incident.io status pages',
        them: 'incident.io',
        rows: [
          {
            feature: 'Incident posts and subscribers',
            logdash: 'Not built in',
            them: 'Built in, unlimited subscribers on the free plan',
            winner: 'them',
          },
          {
            feature: 'Status from uptime checks',
            logdash: 'Built in, every 5 minutes free, 15 seconds on Pro',
            them: 'Follows incidents, fed by your monitoring tool',
            winner: 'logdash',
          },
          {
            feature: 'Custom domain',
            logdash: 'Pro, or any plan with your own build',
            them: 'On the free plan',
            winner: 'them',
          },
          {
            feature: 'Your own design',
            logdash: 'Public API, component and starter',
            them: 'Hosted page with branding',
            winner: 'logdash',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'incident.io',
        reasons: [
          'Written incident updates and subscriber emails matter more to you than automatic status.',
          'You already run incident response there and want the page to follow it.',
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'What are the most important status page best practices?',
        answer:
          'Host it apart from your app, drive it from real checks, keep the component list short, and update during incidents on a schedule. A page that goes down with the app fails all four at once.',
      },
      {
        question: 'What makes good status page incident communication?',
        answer:
          'A first post within minutes saying what is affected, an update at least every hour, and a closing note with the UTC window and who was hit. Recent GitHub and Vercel incident posts are good models.',
      },
      {
        question: 'What to put on a status page?',
        answer:
          'Overall status, a row per component customers can tell apart, 90 days of daily history, the time of the last update, and a way to subscribe or get in touch.',
      },
      {
        question: 'How should a status page uptime percentage be shown?',
        answer:
          'Over a stated window, usually 90 days, with two decimals, rounded down. 99.9% over 90 days allows about 2 hours 10 minutes of downtime, 99.99% about 13 minutes.',
      },
    ],
    updatedAt: '2026-10-02',
  },
];

export const statusPages: SeoFamilyData = {
  family: statusPagesFamily,
  pages: statusPagesPages,
};
