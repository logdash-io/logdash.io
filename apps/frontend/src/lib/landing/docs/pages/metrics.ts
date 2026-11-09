import CurlIcon from '$lib/domains/shared/icons/CurlIcon.svelte';
import type { DocPage } from '$lib/landing/guides/documentation.data';
import { sdkTabs } from '../sdk-docs.data';

export const page: DocPage = {
  path: '/docs/metrics',
  title: 'Metrics',
  metaTitle: 'Metrics | Logdash Docs',
  description:
    'Set or change a number from your code, such as signups, orders or queue length, and watch it on a chart per minute, hour or day.',
  keywords:
    'application metrics, custom metrics, counters, gauges, metrics dashboard, logdash metrics',
  blocks: [
    {
      type: 'paragraph',
      text: 'A metric is a named number, such as `users`, `orders` or `queue_length`. Your code sets it or changes it, and Logdash keeps its history and draws it on a chart. There is nothing to create first: a metric appears with its first value.',
    },
    { type: 'heading', text: 'Send metrics' },
    {
      type: 'code-group',
      items: [
        ...sdkTabs((doc) => doc.metric),
        {
          title: 'curl',
          icon: CurlIcon,
          language: 'bash',
          code: `curl -X PUT https://api.logdash.io/metrics \\
  -H "project-api-key: $LOGDASH_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "users", "value": 1, "operation": "change"}'`,
        },
      ],
    },
    { type: 'heading', text: 'Set or change' },
    {
      type: 'table',
      headers: ['Operation', 'What it does', 'Use it for'],
      rows: [
        [
          '`set`',
          'Replaces the value.',
          'Numbers you can read, such as queue length, memory use or active users.',
        ],
        [
          '`change`',
          'Adds to the value. Send a negative number to subtract.',
          'Things you count as they happen, such as signups or failed payments.',
        ],
      ],
    },
    {
      type: 'paragraph',
      text: 'The SDKs name these operations differently, such as `setMetric` and `mutateMetric` in Node.js, or `metrics.set` and `metrics.mutate` in Python. Over HTTP, send them in `operation`.',
    },
    { type: 'heading', text: 'Apps' },
    {
      type: 'paragraph',
      text: 'Metrics belong to an app. Two apps can each have a metric called `users`, and they stay apart. Name the app with the `app` option of the SDK or the `app` field over HTTP. See [Apps](/docs/concepts#apps).',
    },
    { type: 'heading', text: 'Read a metric' },
    {
      type: 'paragraph',
      text: 'Open your domain and go to **Metrics**. Click a metric to see its chart, with its current value under **Now**. New values show up as they arrive.',
    },
    {
      type: 'list',
      items: [
        'Pick the range of the chart: **1h**, **24h** or **7d** on every plan, and **12h** or **30d** on paid plans.',
        'Short ranges show a point per minute, **24h** a point per hour and **7d** and **30d** a point per day. Your plan sets how long each of them is kept, so a range can show less than its full length.',
        'Focus the chart and use the arrow keys to read each point.',
        '**Delete metric** deletes the metric and its history, and frees its place for a new metric.',
      ],
    },
    { type: 'heading', text: 'Limits' },
    {
      type: 'list',
      items: [
        'Names can be up to 255 characters, and values have to be numbers.',
        'Each app can have a fixed number of metrics. A value for a new metric past that answers `409` with "You have reached the maximum number of metrics for this service", and values of existing metrics keep working.',
      ],
    },
    { type: 'plan-limits', key: 'metrics' },
    {
      type: 'paragraph',
      text: 'For the full request and the read API, see [HTTP API](/docs/api#metrics).',
    },
  ],
};
