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

export type DocsPath =
  | '/guides'
  | '/guides/logging'
  | '/guides/metrics'
  | '/guides/monitoring'
  | '/guides/sdk-migration'
  | '/docs'
  | '/docs/self-hosting'
  | Extract<Pathname, `/docs/${string}`>;

type IconComponent = Component<{ class?: string }>;

export type DocCard = {
  title: string;
  description: string;
  href: DocsPath;
  icon: IconComponent;
};

export type DocLink = {
  title: string;
  description: string;
  href: DocsPath;
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
  | 'json';

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
  | { type: 'links'; items: DocLink[] }
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
    href: '/guides/logging',
    icon: LogsIcon,
  },
  {
    title: 'Metrics',
    description: 'Track the numbers that matter to your business.',
    href: '/guides/metrics',
    icon: MetricsIcon,
  },
  {
    title: 'Monitoring',
    description: 'Health checks, uptime history and alerts.',
    href: '/guides/monitoring',
    icon: MonitoringIcon,
  },
];

export const guideLinks: DocLink[] = [
  {
    title: 'Migrate to @logdash/node',
    description:
      'Move off @logdash/js-sdk to the unified package, by hand or with an AI prompt.',
    href: '/guides/sdk-migration',
  },
];

export const docPages: Record<
  'introduction' | 'logging' | 'metrics' | 'monitoring',
  DocPage
> = {
  introduction: {
    path: '/guides',
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
      { type: 'heading', text: 'Guides' },
      { type: 'links', items: guideLinks },
    ],
  },
  logging: {
    path: '/guides/logging',
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
    path: '/guides/metrics',
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
    path: '/guides/monitoring',
    title: 'Monitoring',
    description:
      'HTTP health checks, uptime history and alerts when things go wrong.',
    blocks: [
      {
        type: 'paragraph',
        text: 'Point a monitor at an endpoint and Logdash checks it on the interval you choose. Downtime shows up in the uptime history, triggers an alert and can be shared on a public status page.',
      },
      { type: 'heading', text: 'What you get' },
      {
        type: 'list',
        items: [
          'HTTP health checks with configurable intervals',
          'Uptime history and response time tracking',
          'Public status pages with custom domains',
          'Alerts on Telegram and webhooks when a check flips to down',
        ],
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
      { title: 'Introduction', href: '/guides', external: false },
      { title: 'Logging', href: '/guides/logging', external: false },
      { title: 'Metrics', href: '/guides/metrics', external: false },
      { title: 'Monitoring', href: '/guides/monitoring', external: false },
    ],
  },
  {
    title: 'SDKs',
    /**
     * These used to point at the GitHub READMEs. They are our own reference
     * pages now, so the sidebar keeps the reader on the site and `/docs` is a
     * real page rather than a redirect.
     *
     * No icons: the sidebar is a plain list of titles, and an icon on the
     * eight SDK rows but not on Overview leaves the column ragged.
     */
    items: [
      { title: 'Overview', href: '/docs', external: false },
      ...sdkDocs.map((doc) => ({
        title: doc.name,
        href: sdkPath(doc),
        external: false as const,
      })),
    ],
  },
  {
    title: 'Guides',
    items: guideLinks.map((guide) => ({
      title: guide.title,
      href: guide.href,
      external: false,
    })),
  },
  {
    title: 'More',
    items: [
      { title: 'Self-hosting', href: '/docs/self-hosting', external: false },
    ],
  },
];
