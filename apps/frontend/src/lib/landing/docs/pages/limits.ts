import type { DocPage } from '$lib/landing/guides/documentation.data';

export const page: DocPage = {
  path: '/docs/limits',
  title: 'Plans and limits',
  metaTitle: 'Plans and limits | Logdash Docs',
  description:
    'Every limit of the Hobby, Builder and Pro plans in one place: domains, apps, monitors, status pages, log retention, metrics and web analytics.',
  keywords:
    'logdash pricing, logdash limits, log retention, rate limits, plan limits, free plan',
  blocks: [
    {
      type: 'paragraph',
      text: 'Logdash has three plans. **Hobby** is free, with no credit card. **Builder** costs $9 a month and **Pro** $15 a month. Compare them on [Pricing](/pricing).',
    },
    {
      type: 'paragraph',
      text: 'Your plan belongs to your account and applies to every domain you add. People you invite work under your plan, whatever their own plan is. The tables below read the same settings as Logdash itself, so they are always current.',
    },
    { type: 'heading', text: 'Upgrade' },
    {
      type: 'list',
      items: [
        'Press **Upgrade your plan** in the account menu, or **Upgrade** on a limit you reach in the app.',
        'Your first upgrade starts with a 30-day free trial.',
        'Once you pay, **Billing** in the account menu opens the billing portal of your subscription.',
      ],
    },
    { type: 'heading', text: 'Account' },
    { type: 'plan-limits', key: 'account' },
    {
      type: 'paragraph',
      text: 'The apps limit counts the apps of every domain you own. Team seats include the Owner and open invites. See [Team members](/docs/team).',
    },
    { type: 'heading', text: 'Monitoring' },
    { type: 'plan-limits', key: 'monitoring' },
    {
      type: 'paragraph',
      text: 'Monitors and status pages count across all the domains you own. See [Uptime monitors](/docs/monitoring) and [Status pages](/docs/status-pages).',
    },
    { type: 'heading', text: 'Logs' },
    { type: 'plan-limits', key: 'logs' },
    {
      type: 'paragraph',
      text: 'Logs kept per app is the retention times the hourly limit, the most an app can have at once. See [Logging](/docs/logging#limits).',
    },
    { type: 'heading', text: 'Metrics' },
    { type: 'plan-limits', key: 'metrics' },
    {
      type: 'paragraph',
      text: 'Each granularity is kept for its own time, so a long chart range shows daily points. See [Metrics](/docs/metrics#read-a-metric).',
    },
    { type: 'heading', text: 'Web analytics' },
    { type: 'plan-limits', key: 'webAnalytics' },
    {
      type: 'paragraph',
      text: 'The hourly limit counts the events of the tracker and of your apps together. See [Web analytics](/docs/web-analytics#plan-limits).',
    },
    { type: 'heading', text: 'At a limit' },
    {
      type: 'table',
      headers: ['Limit', 'What happens'],
      rows: [
        [
          'Domains',
          '**Add domain** offers an upgrade. The API answers `400` with "Cannot create more domains. Maximum limit reached."',
        ],
        [
          'Apps',
          'Logs and metrics of a new app answer `409` with "You have reached the maximum number of apps for your plan". Apps you have keep working.',
        ],
        [
          'Monitors',
          'New monitors answer `409` with "You have reached the maximum number of monitors on your plan". Your monitors keep running.',
        ],
        [
          'Logs per hour',
          'Logs past the limit answer `429` with "Rate limit exceeded" until the hour ends.',
        ],
        [
          'Metrics per app',
          'A new metric answers `409`. Values of the metrics you have keep working.',
        ],
        [
          'Web analytics events',
          'Events past the limit answer `429` until the next full hour in UTC.',
        ],
        [
          'Team seats',
          'The **Team** card shows "All seats are taken. Upgrade to invite more people."',
        ],
        [
          'Retention',
          'Logs, metric points and analytics events older than the retention are deleted.',
        ],
      ],
    },
  ],
};
