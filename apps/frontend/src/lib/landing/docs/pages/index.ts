import AnalyticsIcon from '$lib/domains/shared/icons/AnalyticsIcon.svelte';
import BellIcon from '$lib/domains/shared/icons/BellIcon.svelte';
import CodeIcon from '$lib/domains/shared/icons/CodeIcon.svelte';
import CubeIcon from '$lib/domains/shared/icons/CubeIcon.svelte';
import LogsIcon from '$lib/domains/shared/icons/LogsIcon.svelte';
import MetricsIcon from '$lib/domains/shared/icons/MetricsIcon.svelte';
import MonitoringIcon from '$lib/domains/shared/icons/MonitoringIcon.svelte';
import PublicDashboardIcon from '$lib/domains/shared/icons/PublicDashboardIcon.svelte';
import RocketIcon from '$lib/domains/shared/icons/RocketIcon.svelte';
import SendIcon from '$lib/domains/shared/icons/SendIcon.svelte';
import type { DocPage } from '$lib/landing/guides/documentation.data';

export const page: DocPage = {
  path: '/docs',
  title: 'Introduction',
  metaTitle: 'Logdash Docs',
  description:
    'Logdash is uptime monitoring, status pages, logs, metrics and web analytics for your apps, in one dashboard with nothing to configure.',
  keywords:
    'logdash docs, logdash documentation, uptime monitoring docs, logging docs, web analytics docs',
  blocks: [
    {
      type: 'paragraph',
      text: 'Logdash watches your websites and apps from the outside and from the inside. Uptime monitors check your URLs and tell you when one goes down, status pages show your users what is up, logs and metrics come straight from your code, and web analytics counts your visitors without cookies.',
    },
    {
      type: 'paragraph',
      text: 'Everything lives under a **domain**, such as `example.com`. Add your website address and Logdash starts checking it right away. Add logs, metrics and analytics when you need them, with one key or one script tag.',
    },
    { type: 'heading', text: 'Start here' },
    {
      type: 'cards',
      items: [
        {
          title: 'Quickstart',
          description:
            'Add a domain, send your first log and get an alert when your site goes down.',
          href: '/docs/quickstart',
          icon: RocketIcon,
        },
        {
          title: 'Core concepts',
          description:
            'Domains, apps, the ingest key and personal API keys, and how they fit together.',
          href: '/docs/concepts',
          icon: CubeIcon,
        },
      ],
    },
    { type: 'heading', text: 'Explore Logdash' },
    {
      type: 'cards',
      items: [
        {
          title: 'Uptime monitors',
          description:
            'Check a URL every 5 minutes, every minute or every 15 seconds.',
          href: '/docs/monitoring',
          icon: MonitoringIcon,
        },
        {
          title: 'Alerts',
          description: 'Email, Telegram and webhooks when a monitor goes down.',
          href: '/docs/alerts',
          icon: BellIcon,
        },
        {
          title: 'Status pages',
          description:
            'A public page for your monitors, on your own domain if you want.',
          href: '/docs/status-pages',
          icon: PublicDashboardIcon,
        },
        {
          title: 'Logging',
          description:
            'Send logs from every app and search them as they arrive.',
          href: '/docs/logging',
          icon: LogsIcon,
        },
        {
          title: 'Metrics',
          description:
            'Set or change a number from your code and watch it on a chart.',
          href: '/docs/metrics',
          icon: MetricsIcon,
        },
        {
          title: 'Web analytics',
          description: 'Visitors, sources and custom events, without cookies.',
          href: '/docs/web-analytics',
          icon: AnalyticsIcon,
        },
        {
          title: 'MCP server',
          description:
            'Let your coding agent read your analytics and build insights.',
          href: '/docs/mcp',
          icon: CodeIcon,
        },
        {
          title: 'HTTP API',
          description:
            'Every endpoint the SDKs, the tracker and your own code can call.',
          href: '/docs/api',
          icon: SendIcon,
        },
      ],
    },
    { type: 'heading', text: 'SDKs' },
    {
      type: 'paragraph',
      text: 'Official SDKs send logs and metrics from the languages you already use. Each page covers installation, logging and metrics. Any other language can call the [HTTP API](/docs/api).',
    },
    { type: 'sdks' },
    { type: 'heading', text: 'Get help' },
    {
      type: 'list',
      items: [
        'Ask the team and other users on [Discord](https://discord.gg/naftPW4Hxe).',
        'Report a bug or ask for a feature on [GitHub](https://github.com/logdash-io/logdash.io/issues).',
        'Every docs page has a **Copy page** button that copies it as Markdown, ready to paste into your coding agent. All the docs in one file are at [/llms-full.txt](/llms-full.txt).',
      ],
    },
  ],
};
