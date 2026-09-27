import type { FeaturePageData } from './feature-page';

export const monitoringPage: FeaturePageData = {
  slug: 'monitoring',
  name: 'Uptime monitoring',
  meta: {
    title: 'Uptime monitoring with Telegram downtime alerts | Logdash',
    description:
      'Uptime monitoring for your site and API. Checks as often as every 15 seconds, Telegram and webhook alerts, and a public status page. Start free, no signup.',
    keywords:
      'uptime monitoring, website downtime alerts, telegram uptime alerts, webhook alerts, status page, custom domain status page, free uptime monitor, heartbeat monitoring',
  },
  h1: 'Uptime monitoring for SaaS founders.',
  h1Quiet: 'Your users shouldn’t be the alert.',
  intro:
    'Logdash checks your site or API around the clock and messages you on Telegram as soon as a check fails. Start with a URL, no account needed.',
  overview: {
    title: 'Every app goes down sometimes.',
    quiet: 'Finding out last is the bad part.',
    description:
      'Logdash calls your URL on a schedule and reads the answer. When a check fails, you get a downtime alert on Telegram or a webhook, and customers see it on your status page.',
  },
  capabilities: [
    {
      title: 'HTTP uptime checks',
      body: 'Logdash sends a GET request to your URL every 5 minutes on the free plan, every minute on Builder and every 15 seconds on Pro.',
    },
    {
      title: 'Clear downtime rules',
      body: 'Up is a 2xx or 3xx answer within 10 seconds. Down is a 4xx, a 5xx, a timeout or a refused connection, and the alert says which.',
    },
    {
      title: 'Telegram downtime alerts',
      body: 'Add @logdash_uptime_bot to a chat or group. It posts when a monitor goes down, with the status code and error, and when it recovers.',
    },
    {
      title: 'Webhook alerts',
      body: 'Send every up and down change to your own endpoint, with the method and headers you pick. Wire alerts into any tool that takes HTTP.',
    },
    {
      title: 'Public status pages',
      body: 'A public page with live status and uptime history, so customers check it before they email you. On Pro it runs on your own domain.',
    },
    {
      title: 'Response time history',
      body: 'Every check records how long your server took to answer, so you see an endpoint getting slower well before it starts timing out.',
    },
  ],
  steps: {
    title: 'Three steps to your first alert.',
    description:
      'Nothing to install on your server and no config file. Paste a URL and the first checks come in while you watch.',
    items: [
      {
        title: 'Paste your URL',
        body: 'Enter your site or API address at the top of this page. Checks start right away and each result shows up live, no account needed.',
      },
      {
        title: 'Keep the dashboard',
        body: 'Open the dashboard and sign in with GitHub or Google within 24 hours. Your monitor keeps running on your plan’s check interval.',
      },
      {
        title: 'Connect Telegram or a webhook',
        body: 'Add @logdash_uptime_bot to a chat and send it the passphrase, or paste a webhook URL. The next failed check sends the alert.',
      },
    ],
  },
  faq: [
    {
      question: 'How often does Logdash check my site?',
      answer:
        'Every 5 minutes on the free plan, every minute on Builder and every 15 seconds on Pro. Each check is a GET request to your URL, and the result shows up in your dashboard right away.',
    },
    {
      question: 'What counts as downtime?',
      answer:
        'A check passes when your URL answers with a 2xx or 3xx status within 10 seconds, after following redirects. A 4xx or 5xx status, a timeout or a connection error marks the monitor as down.',
    },
    {
      question: 'Can I get downtime alerts on Telegram?',
      answer:
        'Yes, on every plan, including the free one. Add @logdash_uptime_bot to a private chat or group and send it the passphrase Logdash shows you. It posts when a monitor goes down, with the status code and error, and again when it comes back up.',
    },
    {
      question: 'Which alert channels can I use?',
      answer:
        'Telegram and webhooks, both on every plan. A webhook calls any URL you choose with your own method and headers, so you can handle the alert in your own code. Email, Slack and Discord are not built in yet.',
    },
    {
      question: 'Is there a free uptime monitoring plan?',
      answer:
        'Yes. The Hobby plan is free with no credit card: up to 5 monitors checked every 5 minutes, Telegram and webhook alerts, and one public status page. Builder ($9/month) checks every minute and Pro ($15/month) every 15 seconds.',
    },
    {
      question: 'Can my status page use my own domain?',
      answer:
        'Yes, on the Pro plan. Add a CNAME record from a subdomain such as status.yourapp.com to statuspage.logdash.io and the status page is served there. Other plans publish it on a logdash.io link.',
    },
    {
      question: 'Do I need an account to start monitoring?',
      answer:
        'No. Paste a URL on this page and the first checks start right away. Claim the dashboard with GitHub or Google within 24 hours to keep it.',
    },
    {
      question: 'Can I monitor a private service?',
      answer:
        'Yes, with a push (heartbeat) monitor on Pro. Your service sends a POST to its own Logdash URL every few seconds, and if no call arrives within a 15-second window, the monitor goes down and you get the alert.',
    },
  ],
  related: [
    {
      title: 'Monitoring docs',
      description: 'How checks, uptime history, status pages and alerts work.',
      href: '/docs/monitoring',
    },
    {
      title: 'Health check endpoint guides',
      description:
        'What your endpoint should test before you point a monitor at it, with code for each framework.',
      href: '/health-check',
    },
    {
      title: 'Logdash vs Uptime Robot',
      description: 'How the checks, alerts and free plan compare.',
      href: '/vs/uptime-robot',
    },
    {
      title: 'Pricing',
      description:
        'Check intervals, monitor counts and status pages on each plan.',
      href: '/pricing',
    },
  ],
};
