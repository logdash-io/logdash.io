import type { DocPage } from '$lib/landing/guides/documentation.data';

export const page: DocPage = {
  path: '/docs/status-pages/badges',
  title: 'README badges',
  metaTitle: 'README badges | Logdash Docs',
  description:
    'Show the uptime or the live status of a monitor in your README or on your website, with a badge that links to your status page.',
  keywords:
    'uptime badge, status badge, github readme badge, uptime svg badge, logdash badge',
  blocks: [
    {
      type: 'paragraph',
      text: 'A badge is an SVG image with the uptime or the status of one monitor. It links to your [status page](/docs/status-pages), so a reader who sees a problem can find out more.',
    },
    {
      type: 'callout',
      text: 'Badges show the data of a published status page. Add the monitor to a status page and publish it first.',
    },
    { type: 'heading', text: 'Get a badge' },
    {
      type: 'steps',
      items: [
        {
          title: 'Open the badge settings',
          text: 'Open the status page and find **README badges**. Or open the monitor and press **Get badge** in the **Monitor** card.',
        },
        {
          title: 'Pick a style',
          text: 'Choose the monitor if the page has more than one, then the style and, for **Classic**, the period. The preview shows the badge on a light and a dark background.',
        },
        {
          title: 'Paste the snippet',
          text: 'Copy the snippet and paste it into your README or your HTML.',
          code: {
            language: 'text',
            title: 'README.md',
            code: '[![api.example.com uptime](https://logdash.io/d/<status-page-id>/badges/<badge-key>.svg?style=classic&period=30d)](https://logdash.io/d/<status-page-id>)',
          },
        },
      ],
    },
    { type: 'heading', text: 'Styles' },
    {
      type: 'table',
      headers: ['Style', 'Shows', 'Options'],
      rows: [
        [
          'Classic',
          'The uptime over a period, such as `uptime 30d: 99.98%`.',
          '`period`: `24h`, `7d`, `30d` or `90d`',
        ],
        [
          'Status',
          'The name of the monitor and its live status: Operational, Degraded, Down or Unknown.',
          '`theme`: `light` or `dark`',
        ],
        [
          'Card',
          'The name, the 90-day uptime and one bar per day for the last 90 days.',
          '`theme`: `light` or `dark`',
        ],
      ],
    },
    {
      type: 'paragraph',
      text: 'A monitor with less history than the period shows the time it covers, such as `uptime 12d`. Statuses follow the [status rules](/docs/monitoring#status) of every monitor.',
    },
    { type: 'heading', text: 'Dark mode' },
    {
      type: 'paragraph',
      text: 'For **Status** and **Card**, check **Switch to the dark version when the reader uses dark mode**. The snippet becomes HTML that GitHub and browsers render in the theme of the reader.',
    },
    {
      type: 'code',
      language: 'html',
      title: 'README.md',
      code: `<a href="https://logdash.io/d/<status-page-id>">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://logdash.io/d/<status-page-id>/badges/<badge-key>.svg?style=card&theme=dark">
    <img alt="api.example.com status" src="https://logdash.io/d/<status-page-id>/badges/<badge-key>.svg?style=card&theme=light">
  </picture>
</a>`,
    },
    { type: 'heading', text: 'The badge URL' },
    {
      type: 'code',
      language: 'text',
      code: 'https://logdash.io/d/<status-page-id>/badges/<badge-key>.svg?style=<style>&period=<period>&theme=<theme>',
    },
    {
      type: 'list',
      items: [
        '`style` is `classic`, `status` or `card`. It defaults to `classic`.',
        '`period` applies to `classic` only. It defaults to `30d`.',
        '`theme` applies to `status` and `card` only. It defaults to `light`.',
        'Each monitor has its own `<badge-key>`. Copy it from the snippet.',
      ],
    },
    {
      type: 'paragraph',
      text: 'Badges are cached for 60 seconds. A badge answers with `404` when its status page is private or deleted, or when the monitor is no longer on the page. On the Pro plan, badges leave out the Logdash mark.',
    },
  ],
};
