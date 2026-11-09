import type { ExposedConfig } from '$lib/domains/shared/exposed-config/domain/exposed-config';
import { UserTier } from '$lib/domains/shared/types';

export type Table = {
  headers: string[];
  rows: string[][];
};

export type TableType =
  | 'account'
  | 'monitoring'
  | 'logs'
  | 'metrics'
  | 'webAnalytics';

const PLAN_TIERS = [UserTier.FREE, UserTier.BUILDER, UserTier.PRO] as const;

type PlanTier = (typeof PLAN_TIERS)[number];

type Row = [label: string, cell: (tier: PlanTier) => string];

const PLAN_NAMES: Record<PlanTier, string> = {
  [UserTier.FREE]: 'Hobby',
  [UserTier.BUILDER]: 'Builder',
  [UserTier.PRO]: 'Pro',
};

function formatHours(hours: number | undefined): string {
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

function formatNumber(num: number | undefined): string {
  return num === undefined || num === null ? '-' : num.toLocaleString('en-US');
}

function formatIncluded(value: boolean | undefined): string {
  return value === undefined ? '-' : value ? 'Yes' : 'No';
}

function formatCheckInterval(cron: string | undefined): string {
  const fields = cron?.split(' ') ?? [];
  const every = Number(fields[0]?.match(/^\*\/(\d+)$/)?.[1]);
  if (!every) return '-';
  const unit = fields.length === 6 ? 'second' : 'minute';
  return `${every} ${unit}${every !== 1 ? 's' : ''}`;
}

export function buildTablesFromConfig(
  config: ExposedConfig,
): Record<TableType, Table> {
  const tiers = PLAN_TIERS.filter(
    (tier) => config?.projectPlanConfigs?.[tier] !== undefined,
  );
  const user = (tier: PlanTier): ExposedConfig['userPlanConfigs'][PlanTier] =>
    config?.userPlanConfigs?.[tier];
  const cluster = (
    tier: PlanTier,
  ): ExposedConfig['clusterPlanConfigs'][PlanTier] =>
    config?.clusterPlanConfigs?.[tier];
  const project = (
    tier: PlanTier,
  ): ExposedConfig['projectPlanConfigs'][PlanTier] =>
    config?.projectPlanConfigs?.[tier];

  function table(rows: Row[]): Table {
    return {
      headers: ['Limit', ...tiers.map((tier) => PLAN_NAMES[tier])],
      rows: rows.map(([label, cell]) => [label, ...tiers.map(cell)]),
    };
  }

  return {
    account: table([
      [
        'Domains',
        (tier) => formatNumber(user(tier)?.projects?.maxNumberOfProjects),
      ],
      [
        'Apps, across all your domains',
        (tier) => formatNumber(user(tier)?.projects?.maxNumberOfProjects),
      ],
      [
        'Team seats per domain',
        (tier) => formatNumber(cluster(tier)?.maxClusterMembers),
      ],
    ]),
    monitoring: table([
      [
        'Monitors, across all your domains',
        (tier) => formatNumber(user(tier)?.httpMonitors?.maxNumberOfMonitors),
      ],
      [
        'Check interval',
        (tier) =>
          formatCheckInterval(cluster(tier)?.httpMonitors?.pingFrequency),
      ],
      [
        'Heartbeat monitors',
        (tier) =>
          formatIncluded(cluster(tier)?.httpMonitors?.canCreatePushMonitors),
      ],
      [
        'Status pages',
        (tier) =>
          formatNumber(
            user(tier)?.publicDashboards?.maxNumberOfPublicDashboards,
          ),
      ],
      [
        'Custom status page domain',
        (tier) => formatIncluded(cluster(tier)?.customDomains?.canCreate),
      ],
    ]),
    logs: table([
      ['Retention', (tier) => formatHours(project(tier)?.logs?.retentionHours)],
      [
        'Logs per app per hour',
        (tier) => formatNumber(project(tier)?.logs?.rateLimitPerHour),
      ],
      [
        'Logs kept per app',
        (tier) => {
          const logs = project(tier)?.logs;
          return logs?.retentionHours && logs.rateLimitPerHour
            ? formatCompactNumber(logs.retentionHours * logs.rateLimitPerHour)
            : '-';
        },
      ],
    ]),
    metrics: table([
      [
        'Metrics per app',
        (tier) =>
          formatNumber(project(tier)?.metrics?.maxMetricsRegisterEntries),
      ],
      [
        'Per-minute points kept',
        (tier) =>
          formatHours(
            project(tier)?.metrics?.keepGranularitiesForHours?.minute,
          ),
      ],
      [
        'Hourly points kept',
        (tier) =>
          formatHours(project(tier)?.metrics?.keepGranularitiesForHours?.hour),
      ],
      [
        'Daily points kept',
        (tier) =>
          formatHours(project(tier)?.metrics?.keepGranularitiesForHours?.day),
      ],
    ]),
    webAnalytics: table([
      [
        'Retention',
        (tier) => {
          const days = cluster(tier)?.webAnalytics?.retentionDays;
          return formatHours(days && days * 24);
        },
      ],
      [
        'Events per domain per hour',
        (tier) => formatNumber(cluster(tier)?.webAnalytics?.rateLimitPerHour),
      ],
    ]),
  };
}
