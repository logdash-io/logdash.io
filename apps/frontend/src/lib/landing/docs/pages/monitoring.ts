import BellIcon from '$lib/domains/shared/icons/BellIcon.svelte';
import RefreshIcon from '$lib/domains/shared/icons/RefreshIcon.svelte';
import PublicDashboardIcon from '$lib/domains/shared/icons/PublicDashboardIcon.svelte';
import type { DocPage } from '$lib/landing/guides/documentation.data';

export const page: DocPage = {
  path: '/docs/monitoring',
  title: 'Uptime monitors',
  metaTitle: 'Uptime monitors | Logdash Docs',
  description:
    'Check a URL every 5 minutes, every minute or every 15 seconds, see its uptime and response time, and get alerted when it goes down.',
  keywords:
    'uptime monitoring, website monitoring, http monitor, health check monitoring, logdash uptime',
  blocks: [
    {
      type: 'paragraph',
      text: 'An uptime monitor requests one URL from Logdash servers at a fixed interval and records every check: the status code, the response time and, when it fails, why. When two checks in a row fail, Logdash alerts the channels of the domain.',
    },
    {
      type: 'paragraph',
      text: 'Logdash has two kinds of monitors. This page covers the monitors that check a URL. For a worker or another process that has no URL, use a [heartbeat monitor](/docs/monitoring/heartbeats): your process calls Logdash, and Logdash alerts you when the calls stop.',
    },
    { type: 'heading', text: 'Add a monitor' },
    {
      type: 'paragraph',
      text: 'Your domain gets its first monitor when you add it. To watch more addresses, such as your API or a health check endpoint:',
    },
    {
      type: 'steps',
      items: [
        {
          title: 'Open Uptime',
          text: 'Open your domain, go to **Uptime** and press **Add monitor**.',
        },
        {
          title: 'Enter the URL',
          text: 'Keep **We check a URL**, enter the full URL, such as `https://api.example.com/health`, and give the monitor a name.',
        },
        {
          title: 'Start monitoring',
          text: 'Press **Start monitoring**. The first check runs within about a second, and the next ones follow the interval of your plan.',
        },
      ],
    },
    {
      type: 'callout',
      text: 'Point monitors at a URL that proves your app works, such as a health endpoint that touches the database. Many hosts answer every path with the same page, even when the app behind them is broken. When Logdash sees that, the monitor page warns you and offers `/health`, `/api/health` or `/up` if your host serves one of them.',
    },
    { type: 'heading', text: 'How a check works' },
    {
      type: 'table',
      headers: ['What', 'How'],
      rows: [
        ['Request', 'A `GET` with no extra headers and no body.'],
        [
          'Up',
          'Any status code from `200` to `399`. Everything else is a failed check.',
        ],
        [
          'Timeout',
          '10 seconds. A slower answer fails with "Timed out after 10s".',
        ],
        [
          'Redirects',
          '`301`, `302`, `303`, `307` and `308` are followed, up to 5 in a row.',
        ],
        ['Response body', 'Read up to 5 MB.'],
        [
          'Addresses',
          'Every host, including each redirect target, has to resolve to a public IP address. Private and local addresses fail with "Hostname does not resolve to a public address".',
        ],
      ],
    },
    {
      type: 'paragraph',
      text: 'A check that got no answer records status code `0` and a reason, such as "Connection refused", "Connection reset" or "DNS lookup timed out". A check that got an error status records the start of the response body as its message, so you can see what your server said.',
    },
    {
      type: 'paragraph',
      text: 'When most monitors get no answer in the same round, the problem is on the side of Logdash, not yours. Logdash drops those checks instead of recording them, so an outage of its own never alerts you.',
    },
    { type: 'heading', text: 'Check interval' },
    {
      type: 'paragraph',
      text: 'Monitors check every 5 minutes on Hobby, every minute on Builder and every 15 seconds on Pro. The interval follows the plan of the domain owner and applies to every monitor of the domain.',
    },
    { type: 'heading', text: 'Status' },
    {
      type: 'paragraph',
      text: 'Each monitor has a status, computed from its latest checks:',
    },
    {
      type: 'table',
      headers: ['Status', 'When'],
      rows: [
        ['Down', 'The 2 latest checks both failed.'],
        ['Degraded', 'Any of the last 10 checks failed, but not the 2 latest.'],
        ['Up', 'None of the last 10 checks failed.'],
        ['Unknown', 'The monitor has no checks yet.'],
      ],
    },
    {
      type: 'paragraph',
      text: 'Alerts, [status pages](/docs/status-pages) and [badges](/docs/status-pages/badges) all use these rules, so a single failed check never pages you. The Logdash dashboard is stricter: it shows a monitor as down from its first failed check, so you see trouble before anyone else does.',
    },
    { type: 'heading', text: 'The Uptime page' },
    {
      type: 'paragraph',
      text: 'The **Uptime** page of a domain shows how many monitors are down, the average response time and the uptime over the range you pick, **90 hours** or **90 days**. Below it, each monitor has a row with its latest checks.',
    },
    {
      type: 'paragraph',
      text: 'Monitors of well-known services you depend on, such as Stripe, GitHub or OpenAI, are listed apart under **Dependencies**, so your own services stay on top.',
    },
    { type: 'heading', text: 'The monitor page', level: 3 },
    {
      type: 'paragraph',
      text: 'Click a monitor to open its page. It shows the status and the latest checks, live, with the status code, response time and error message of each. Below that, **Uptime history** has one bar per hour or per day for the range you picked.',
    },
    {
      type: 'list',
      items: [
        '**Alerts** lists the channels of the domain. Uncheck a channel to stop alerts from this monitor only. See [Alerts](/docs/alerts).',
        '**Edit**, in the **Monitor** card, changes the name and the URL of the monitor.',
        '**Get badge** gives you a README badge with the uptime of the monitor. See [README badges](/docs/status-pages/badges).',
        'The trash button of the **Monitor** card deletes the monitor with its uptime history and alerts. This cannot be undone.',
      ],
    },
    {
      type: 'callout',
      text: 'There is no pause. To stop checking an address, delete its monitor.',
    },
    { type: 'heading', text: 'Plan limits' },
    {
      type: 'paragraph',
      text: 'The number of monitors counts across all the domains you own. Monitors in domains you were invited to count toward the plan of their owner.',
    },
    { type: 'plan-limits', key: 'monitoring' },
    { type: 'heading', text: 'Next steps' },
    {
      type: 'cards',
      items: [
        {
          title: 'Set up alerts',
          description: 'Get a message on Telegram or call your own webhook.',
          href: '/docs/alerts',
          icon: BellIcon,
        },
        {
          title: 'Monitor a worker',
          description: 'Get alerted when a process stops calling in.',
          href: '/docs/monitoring/heartbeats',
          icon: RefreshIcon,
        },
        {
          title: 'Publish a status page',
          description: 'Show your users which of your services are up.',
          href: '/docs/status-pages',
          icon: PublicDashboardIcon,
        },
      ],
    },
  ],
};
