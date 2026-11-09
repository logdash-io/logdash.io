import CurlIcon from '$lib/domains/shared/icons/CurlIcon.svelte';
import type { DocPage } from '$lib/landing/guides/documentation.data';
import { sdkTabs } from '../sdk-docs.data';

export const page: DocPage = {
  path: '/docs/sdks',
  title: 'SDKs',
  metaTitle: 'SDKs | Logdash Docs',
  description:
    'Official open-source SDKs for Node.js, Python, Go, .NET, Java, Rust, Ruby and PHP that send logs and metrics to Logdash.',
  keywords:
    'logdash sdk, logging sdk, node logging, python logging, go logging, dotnet logging, java logging, rust logging, ruby logging, php logging',
  blocks: [
    {
      type: 'paragraph',
      text: 'The SDKs send [logs](/docs/logging) and [metrics](/docs/metrics) from your servers, workers and scripts. They are open source and work the same way in every language: create a client with your ingest key, then call a method per log level and per metric operation.',
    },
    { type: 'sdks' },
    { type: 'heading', text: 'Install' },
    { type: 'code-group', items: sdkTabs((doc) => doc.install) },
    { type: 'heading', text: 'Send your first log' },
    {
      type: 'paragraph',
      text: 'Copy the ingest key from **Settings** of your domain and keep it in `LOGDASH_API_KEY`.',
    },
    { type: 'code-group', items: sdkTabs((doc) => doc.log) },
    { type: 'heading', text: 'What every SDK does' },
    {
      type: 'list',
      items: [
        'Sends logs at the seven [levels](/docs/logging#levels), from `error` to `silly`.',
        'Sets a metric or changes it by a number. See [Set or change](/docs/metrics#set-or-change).',
        'Sends events to [web analytics](/docs/web-analytics/app-events), next to the visits of your website.',
        'Names the app that sends, such as `api` or `worker`. See [Apps](/docs/concepts#apps).',
      ],
    },
    { type: 'heading', text: 'No SDK for your language' },
    {
      type: 'paragraph',
      text: 'Any language that makes HTTP requests can send logs and metrics. See the [HTTP API](/docs/api).',
    },
    {
      type: 'code-group',
      items: [
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
    {
      type: 'callout',
      text: 'The SDKs are for servers. To measure the visitors of a website, add the [web analytics tracker](/docs/web-analytics) instead.',
    },
  ],
};
