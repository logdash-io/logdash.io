import { LogdashSDKName, UserTier } from '$lib/domains/shared/types';
import type { ExposedConfig } from '$lib/domains/shared/exposed-config/domain/exposed-config';

export type Table = {
  headers: string[];
  rows: string[][];
};

export type TableType =
  | 'logsRetention'
  | 'logsRateLimits'
  | 'metricsPerService'
  | 'metricsRetention';

export const tableTitles: Record<TableType, string> = {
  logsRetention: 'Logs retention',
  logsRateLimits: 'Rate limit per hour',
  metricsPerService: 'Metrics per service',
  metricsRetention: 'Metrics retention',
};

const PLAN_TIERS = [UserTier.FREE, UserTier.BUILDER, UserTier.PRO] as const;

const PLAN_NAMES: Record<(typeof PLAN_TIERS)[number], string> = {
  [UserTier.FREE]: 'Hobby',
  [UserTier.BUILDER]: 'Builder',
  [UserTier.PRO]: 'Pro',
};

function formatRetentionHours(hours: number | undefined): string {
  if (!hours) return '-';
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''}`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''}`;
}

function formatCompactNumber(num: number | undefined): string {
  if (num === undefined || num === null) return '-';
  if (num >= 1_000_000) {
    const millions = num / 1_000_000;
    return `${millions % 1 === 0 ? millions : millions.toFixed(1)}M`;
  }
  if (num >= 1_000) {
    const thousands = num / 1_000;
    return `${thousands % 1 === 0 ? thousands : thousands.toFixed(0)}k`;
  }
  return num.toLocaleString('en-US');
}

function formatRateLimit(num: number | undefined): string {
  if (num === undefined || num === null) return '-';
  return num.toLocaleString('en-US');
}

function calculateLogsCapacity(
  retentionHours: number,
  rateLimitPerHour: number,
): number {
  return retentionHours * rateLimitPerHour;
}

function formatLogsRetention(
  retentionHours: number | undefined,
  rateLimitPerHour: number | undefined,
): string {
  if (!retentionHours || !rateLimitPerHour) return '-';
  const logsCapacity = calculateLogsCapacity(retentionHours, rateLimitPerHour);
  const formattedLogs = formatCompactNumber(logsCapacity);
  return `${formatRetentionHours(retentionHours)} (${formattedLogs} logs per service)`;
}

function getProjectPlanConfig(config: ExposedConfig, tier: UserTier) {
  return config?.projectPlanConfigs?.[tier];
}

export function buildTablesFromConfig(
  config: ExposedConfig,
): Record<TableType, Table> {
  const availableTiers = PLAN_TIERS.filter(
    (tier) => getProjectPlanConfig(config, tier) !== undefined,
  );
  const headers = availableTiers.map((tier) => PLAN_NAMES[tier]);

  return {
    logsRetention: {
      headers,
      rows: [
        availableTiers.map((tier) => {
          const planConfig = getProjectPlanConfig(config, tier);
          return formatLogsRetention(
            planConfig?.logs?.retentionHours,
            planConfig?.logs?.rateLimitPerHour,
          );
        }),
      ],
    },
    logsRateLimits: {
      headers,
      rows: [
        availableTiers.map((tier) => {
          const planConfig = getProjectPlanConfig(config, tier);
          return formatRateLimit(planConfig?.logs?.rateLimitPerHour);
        }),
      ],
    },
    metricsPerService: {
      headers,
      rows: [
        availableTiers.map((tier) => {
          const planConfig = getProjectPlanConfig(config, tier);
          return String(planConfig?.metrics?.maxMetricsRegisterEntries ?? '-');
        }),
      ],
    },
    metricsRetention: {
      headers,
      rows: [
        availableTiers.map((tier) => {
          const planConfig = getProjectPlanConfig(config, tier);
          const granularities = planConfig?.metrics?.keepGranularitiesForHours;
          const maxRetention = Math.max(
            granularities?.minute ?? 0,
            granularities?.hour ?? 0,
            granularities?.day ?? 0,
          );
          return formatRetentionHours(maxRetention || undefined);
        }),
      ],
    },
  };
}

export interface DocSection {
  id: string;
  slug?: string;
  title: string;
  content: string;
  tableKeys?: TableType[];
  tables?: Record<string, Table>;
}

export interface GettingStartedPage {
  slug: string;
  title: string;
}

export const gettingStartedPages: GettingStartedPage[] = [
  { slug: '', title: 'Introduction' },
  { slug: 'logging', title: 'Logging' },
  { slug: 'metrics', title: 'Metrics' },
  { slug: 'monitoring', title: 'Monitoring' },
];

export const docSectionTemplates: Record<string, DocSection[]> = {
  introduction: [
    {
      id: 'introduction',
      title: 'Introduction',
      content: `Logdash is a powerful platform for logging, tracking metrics, and monitoring your applications.

Our core philosophy is simplicity - zero configuration and no headaches.

Logdash is built on top of 3 pillars:
- Logging
- Metrics
- Monitoring

Depending on your location, we achieve sub-100ms latency from log transmission to dashboard display.`,
    },
  ],
  logging: [
    {
      id: 'logging',
      title: 'Logging',
      content: `Track your system events and errors in real-time, even from multiple instances, with structured data that makes debugging and analysis simple.

Your subscription plan determines logs retention and the hourly rate limits for sending logs.`,
      tableKeys: ['logsRetention', 'logsRateLimits'],
    },
  ],
  metrics: [
    {
      id: 'metrics',
      title: 'Metrics',
      content: `Track custom metrics directly from your application to monitor key business indicators.

Common examples include user registration numbers, order volumes, file upload statistics, and any custom data points relevant to your business.

Your subscription plan determines the number of metrics per service and retention period.`,
      tableKeys: ['metricsPerService', 'metricsRetention'],
    },
  ],
  monitoring: [
    {
      id: 'monitoring',
      title: 'Monitoring',
      content: `Monitor your services with HTTP health checks and get alerted when things go wrong.

Set up uptime monitors to track your endpoints, view historical uptime data, and create public status pages to keep your users informed.

Features include:
- HTTP health checks with configurable intervals
- Uptime history and response time tracking
- Public status pages with custom domains
- Alerting via Telegram, webhooks, and more`,
    },
  ],
};

export function buildDocSections(
  config: ExposedConfig,
  pageSlug: string = 'introduction',
): DocSection[] {
  const tables = buildTablesFromConfig(config);
  const templates =
    docSectionTemplates[pageSlug] || docSectionTemplates.introduction;

  return templates.map((template) => ({
    ...template,
    tables: template.tableKeys
      ? Object.fromEntries(template.tableKeys.map((key) => [key, tables[key]]))
      : undefined,
  }));
}

export interface SDKGuide {
  id: string;
  title: string;
  sdkId: LogdashSDKName;
  externalUrl: string;
}

export const sdkGuides: SDKGuide[] = [
  {
    id: 'node-js-getting-started',
    title: 'Getting Started',
    sdkId: LogdashSDKName.NODE_JS,
    externalUrl:
      'https://github.com/logdash-io/node-sdk?tab=readme-ov-file#logdashnode',
  },
  {
    id: 'node-js-logging',
    title: 'Logging',
    sdkId: LogdashSDKName.NODE_JS,
    externalUrl:
      'https://github.com/logdash-io/js-sdk?tab=readme-ov-file#logging',
  },
  {
    id: 'node-js-metrics',
    title: 'Metrics',
    sdkId: LogdashSDKName.NODE_JS,
    externalUrl:
      'https://github.com/logdash-io/js-sdk?tab=readme-ov-file#metrics',
  },
  {
    id: 'python-getting-started',
    title: 'Getting Started',
    sdkId: LogdashSDKName.PYTHON,
    externalUrl:
      'https://github.com/logdash-io/python-sdk?tab=readme-ov-file#quick-start',
  },
  {
    id: 'python-logging',
    title: 'Logging',
    sdkId: LogdashSDKName.PYTHON,
    externalUrl:
      'https://github.com/logdash-io/python-sdk?tab=readme-ov-file#logging',
  },
  {
    id: 'python-metrics',
    title: 'Metrics',
    sdkId: LogdashSDKName.PYTHON,
    externalUrl:
      'https://github.com/logdash-io/python-sdk?tab=readme-ov-file#metrics',
  },
  {
    id: 'go-getting-started',
    title: 'Getting Started',
    sdkId: LogdashSDKName.GO,
    externalUrl:
      'https://github.com/logdash-io/go-sdk?tab=readme-ov-file#quick-start',
  },
  {
    id: 'go-logging',
    title: 'Logging',
    sdkId: LogdashSDKName.GO,
    externalUrl:
      'https://github.com/logdash-io/go-sdk?tab=readme-ov-file#logging',
  },
  {
    id: 'go-metrics',
    title: 'Metrics',
    sdkId: LogdashSDKName.GO,
    externalUrl:
      'https://github.com/logdash-io/go-sdk?tab=readme-ov-file#metrics',
  },
  {
    id: 'dotnet-getting-started',
    title: 'Getting Started',
    sdkId: LogdashSDKName.DOTNET,
    externalUrl:
      'https://github.com/logdash-io/dotnet-sdk?tab=readme-ov-file#quick-start',
  },
  {
    id: 'dotnet-logging',
    title: 'Logging',
    sdkId: LogdashSDKName.DOTNET,
    externalUrl:
      'https://github.com/logdash-io/dotnet-sdk?tab=readme-ov-file#logging',
  },
  {
    id: 'dotnet-metrics',
    title: 'Metrics',
    sdkId: LogdashSDKName.DOTNET,
    externalUrl:
      'https://github.com/logdash-io/dotnet-sdk?tab=readme-ov-file#metrics',
  },
  {
    id: 'java-getting-started',
    title: 'Getting Started',
    sdkId: LogdashSDKName.JAVA,
    externalUrl:
      'https://github.com/logdash-io/java-sdk?tab=readme-ov-file#quick-start',
  },
  {
    id: 'java-logging',
    title: 'Logging',
    sdkId: LogdashSDKName.JAVA,
    externalUrl:
      'https://github.com/logdash-io/java-sdk?tab=readme-ov-file#logging',
  },
  {
    id: 'java-metrics',
    title: 'Metrics',
    sdkId: LogdashSDKName.JAVA,
    externalUrl:
      'https://github.com/logdash-io/java-sdk?tab=readme-ov-file#metrics',
  },
  {
    id: 'rust-getting-started',
    title: 'Getting Started',
    sdkId: LogdashSDKName.RUST,
    externalUrl:
      'https://github.com/logdash-io/rust-sdk?tab=readme-ov-file#quick-start',
  },
  {
    id: 'rust-logging',
    title: 'Logging',
    sdkId: LogdashSDKName.RUST,
    externalUrl:
      'https://github.com/logdash-io/rust-sdk?tab=readme-ov-file#logging',
  },
  {
    id: 'rust-metrics',
    title: 'Metrics',
    sdkId: LogdashSDKName.RUST,
    externalUrl:
      'https://github.com/logdash-io/rust-sdk?tab=readme-ov-file#metrics',
  },
  {
    id: 'ruby-getting-started',
    title: 'Getting Started',
    sdkId: LogdashSDKName.RUBY,
    externalUrl:
      'https://github.com/logdash-io/ruby-sdk?tab=readme-ov-file#quick-start',
  },
  {
    id: 'ruby-logging',
    title: 'Logging',
    sdkId: LogdashSDKName.RUBY,
    externalUrl:
      'https://github.com/logdash-io/ruby-sdk?tab=readme-ov-file#logging',
  },
  {
    id: 'ruby-metrics',
    title: 'Metrics',
    sdkId: LogdashSDKName.RUBY,
    externalUrl:
      'https://github.com/logdash-io/ruby-sdk?tab=readme-ov-file#metrics',
  },
];

export interface InternalGuide {
  id: string;
  slug: string;
  title: string;
  description: string;
  sdkId?: LogdashSDKName;
}

export const internalGuides: InternalGuide[] = [
  {
    id: 'sdk-migration',
    slug: 'sdk-migration',
    title: 'From @logdash/js-sdk',
    description: 'Migrating from @logdash/js-sdk to @logdash/node',
    sdkId: LogdashSDKName.NODE_JS,
  },
];

function getEffectiveSDKId(sdkId: LogdashSDKName): LogdashSDKName {
  if (sdkId === LogdashSDKName.NEXT_JS || sdkId === LogdashSDKName.SVELTE_KIT) {
    return LogdashSDKName.NODE_JS;
  }
  return sdkId;
}

export function getSDKGuides(sdkId: LogdashSDKName): SDKGuide[] {
  const effectiveId = getEffectiveSDKId(sdkId);
  return sdkGuides.filter((guide) => guide.sdkId === effectiveId);
}

export function getInternalGuides(sdkId: LogdashSDKName): InternalGuide[] {
  const effectiveId = getEffectiveSDKId(sdkId);
  return internalGuides.filter(
    (guide) => !guide.sdkId || guide.sdkId === effectiveId,
  );
}
