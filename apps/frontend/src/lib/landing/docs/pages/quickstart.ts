import CurlIcon from '$lib/domains/shared/icons/CurlIcon.svelte';
import AnalyticsIcon from '$lib/domains/shared/icons/AnalyticsIcon.svelte';
import MetricsIcon from '$lib/domains/shared/icons/MetricsIcon.svelte';
import PublicDashboardIcon from '$lib/domains/shared/icons/PublicDashboardIcon.svelte';
import type { DocPage } from '$lib/landing/guides/documentation.data';
import { sdkTabs } from '../sdk-docs.data';

export const page: DocPage = {
  path: '/docs/quickstart',
  title: 'Quickstart',
  metaTitle: 'Quickstart | Logdash Docs',
  description:
    'Add your domain, get an alert when it goes down and send your first log, in about five minutes.',
  keywords:
    'logdash quickstart, logdash getting started, uptime monitoring setup, send first log',
  blocks: [
    {
      type: 'paragraph',
      text: 'This guide takes you from no account to a monitored website, an alert channel and your first log. Each step links to the full guide when you want more.',
    },
    { type: 'heading', text: 'Monitor your website' },
    {
      type: 'steps',
      items: [
        {
          title: 'Sign in',
          text: '[Sign in to Logdash](/app/auth) with GitHub or Google. The Hobby plan is free and needs no card.',
        },
        {
          title: 'Add your domain',
          text: 'Enter your website address, such as `example.com`, and press **Start monitoring**. Logdash checks it right away, then every 5 minutes on the Hobby plan.',
        },
        {
          title: 'Monitor more addresses',
          text: 'Under **Monitor more**, add the other URLs your users open, such as `api.example.com` or a health check endpoint, then press **Done**. See [Uptime monitors](/docs/monitoring) for what counts as up.',
        },
      ],
    },
    { type: 'heading', text: 'Get alerted' },
    {
      type: 'paragraph',
      text: 'A new monitor alerts the channels of its domain. When the domain has none yet, Logdash adds an email channel for the address you signed in with, so you hear about downtime without any setup. To get alerts on Telegram or to call your own webhook, open your domain, go to **Settings** and press **Add channel** in the **Alerts** card. See [Alerts](/docs/alerts) for every channel and what the messages look like.',
    },
    { type: 'heading', text: 'Send your first log' },
    {
      type: 'paragraph',
      text: 'Go to **Logs**, pick your language and press **Copy prompt**. Paste the prompt into your coding agent, and it installs the SDK and adds logging with your ingest key. To do it by hand, follow the steps below.',
    },
    {
      type: 'steps',
      items: [
        {
          title: 'Copy the ingest key',
          text: 'Open **Settings** and press **Copy** in the **Ingest key** card. Keep it in an environment variable, such as `LOGDASH_API_KEY`. It can only write, so a leaked key cannot read your data.',
        },
        {
          title: 'Install the SDK',
          text: 'Pick your language. The tab you pick stays picked on every page.',
          tabs: sdkTabs((doc) => doc.install),
        },
        {
          title: 'Send a log',
          text: 'Logs show up in **Logs** within a second. Without an SDK, send the same log with one HTTP request.',
          tabs: [
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
      ],
    },
    {
      type: 'callout',
      text: 'Short-lived processes, such as cron jobs and serverless functions, can exit before the SDK sends what it queued. Flush before you exit, as the page for [your SDK](/docs/sdks) shows.',
    },
    { type: 'heading', text: 'Next steps' },
    {
      type: 'cards',
      items: [
        {
          title: 'Publish a status page',
          description:
            'Show your users which services are up, on your own domain.',
          href: '/docs/status-pages',
          icon: PublicDashboardIcon,
        },
        {
          title: 'Add the web analytics tracker',
          description: 'Count visitors and custom events without cookies.',
          href: '/docs/web-analytics',
          icon: AnalyticsIcon,
        },
        {
          title: 'Send metrics',
          description: 'Chart signups, orders or queue length from your code.',
          href: '/docs/metrics',
          icon: MetricsIcon,
        },
      ],
    },
  ],
};
