import { SDK_LIST } from '$lib/domains/logs/domain/sdk-config';
import { LogdashSDKName } from '$lib/domains/shared/types';
import type { Pathname } from '$app/types';
import type { Component } from 'svelte';
import type { TableType } from './plan-limits';

export type DocsPath = '/docs' | Extract<Pathname, `/docs/${string}`>;

type IconComponent = Component<{ class?: string }>;

export type DocCard = {
  title: string;
  description: string;
  href: DocsPath;
  icon: IconComponent;
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
  | 'json'
  | 'html'
  | 'powershell'
  | 'svelte'
  | 'text';

export type DocCode = {
  language: CodeLanguage;
  code: string;
  title?: string;
};

export type DocCodeTab = DocCode & { title: string; icon?: IconComponent };

export type DocFaqItem = { question: string; answer: string };

export type DocStep = {
  title: string;
  text: string;
  code?: DocCode;
  tabs?: DocCodeTab[];
};

export type ComparisonWinner = 'logdash' | 'them' | 'tie';

export type DocComparisonRow = {
  feature: string;
  logdash: string;
  them: string;
  winner: ComparisonWinner;
};

export type DocBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string; level?: 3 }
  | { type: 'list'; items: string[] }
  | { type: 'callout'; tone?: 'note' | 'warning'; text: string }
  | { type: 'plan-limits'; key: TableType }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'cards'; items: DocCard[] }
  | { type: 'sdks' }
  | ({ type: 'code' } & DocCode)
  | { type: 'code-group'; items: DocCodeTab[] }
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
  metaTitle?: string;
  keywords?: string;
  blocks: DocBlock[];
}

export type Sdk = {
  name: string;
  slug: string;
  id: LogdashSDKName;
  readmeUrl: string;
  icon: IconComponent;
};

const SDK_REPOS: {
  name: string;
  slug: string;
  id: LogdashSDKName;
  repo: string;
}[] = [
  {
    name: 'Node.js',
    slug: 'node',
    id: LogdashSDKName.NODE_JS,
    repo: 'node-sdk',
  },
  {
    name: 'Python',
    slug: 'python',
    id: LogdashSDKName.PYTHON,
    repo: 'python-sdk',
  },
  { name: 'Go', slug: 'go', id: LogdashSDKName.GO, repo: 'go-sdk' },
  {
    name: '.NET',
    slug: 'dotnet',
    id: LogdashSDKName.DOTNET,
    repo: 'dotnet-sdk',
  },
  { name: 'Java', slug: 'java', id: LogdashSDKName.JAVA, repo: 'java-sdk' },
  { name: 'Rust', slug: 'rust', id: LogdashSDKName.RUST, repo: 'rust-sdk' },
  { name: 'Ruby', slug: 'ruby', id: LogdashSDKName.RUBY, repo: 'ruby-sdk' },
  { name: 'PHP', slug: 'php', id: LogdashSDKName.PHP, repo: 'php-sdk' },
];

export const SDKS: Sdk[] = SDK_REPOS.map(({ name, slug, id, repo }) => ({
  name,
  slug,
  id,
  readmeUrl: `https://github.com/logdash-io/${repo}#readme`,
  icon: SDK_LIST.find((sdk) => sdk.name === id)?.icon as IconComponent,
}));

export type DocsNavItem = { title: string; href: DocsPath };

export type DocsNavGroup = { title: string; items: DocsNavItem[] };

export const docsNav: DocsNavGroup[] = [
  {
    title: 'Getting started',
    items: [
      { title: 'Introduction', href: '/docs' },
      { title: 'Quickstart', href: '/docs/quickstart' },
      { title: 'Core concepts', href: '/docs/concepts' },
    ],
  },
  {
    title: 'Monitoring',
    items: [
      { title: 'Uptime monitors', href: '/docs/monitoring' },
      { title: 'Cron and heartbeats', href: '/docs/monitoring/heartbeats' },
      { title: 'Alerts', href: '/docs/alerts' },
    ],
  },
  {
    title: 'Status pages',
    items: [
      { title: 'Publish a status page', href: '/docs/status-pages' },
      { title: 'README badges', href: '/docs/status-pages/badges' },
      { title: 'Build your own', href: '/docs/status-pages/api' },
    ],
  },
  {
    title: 'Logs and metrics',
    items: [
      { title: 'Logging', href: '/docs/logging' },
      { title: 'Metrics', href: '/docs/metrics' },
    ],
  },
  {
    title: 'Web analytics',
    items: [
      { title: 'Add the tracker', href: '/docs/web-analytics' },
      { title: 'Serve it from your domain', href: '/docs/web-analytics/proxy' },
      { title: 'Custom events', href: '/docs/web-analytics/custom-events' },
      {
        title: 'Events from your apps',
        href: '/docs/web-analytics/app-events',
      },
      { title: 'Tag your links', href: '/docs/web-analytics/links' },
      { title: 'Identify users', href: '/docs/web-analytics/identify' },
      { title: 'Read the dashboard', href: '/docs/web-analytics/dashboard' },
      { title: 'Insights', href: '/docs/web-analytics/insights' },
      { title: 'Opt-out', href: '/docs/web-analytics/opt-out' },
      { title: 'Privacy', href: '/docs/web-analytics-privacy' },
    ],
  },
  {
    title: 'Coding agents',
    items: [
      { title: 'MCP server', href: '/docs/mcp' },
      { title: 'API keys', href: '/docs/api-keys' },
    ],
  },
  {
    title: 'Reference',
    items: [
      { title: 'HTTP API', href: '/docs/api' },
      { title: 'Plans and limits', href: '/docs/limits' },
    ],
  },
  {
    title: 'SDKs',
    items: [
      { title: 'Overview', href: '/docs/sdks' },
      ...SDKS.map((sdk) => ({
        title: sdk.name,
        href: `/docs/sdks/${sdk.slug}` as DocsPath,
      })),
    ],
  },
  {
    title: 'Account',
    items: [
      { title: 'Team members', href: '/docs/team' },
      { title: 'Self-hosting', href: '/docs/self-hosting' },
    ],
  },
];

export type DocsNavEntry = DocsNavItem & { group: string };

export const docsNavEntries: DocsNavEntry[] = docsNav.flatMap((group) =>
  group.items.map((item) => ({ ...item, group: group.title })),
);
